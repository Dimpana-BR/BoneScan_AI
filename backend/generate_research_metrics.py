import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, roc_curve, auc, classification_report

# Configuration
DATA_DIR = "dataset"
BATCH_SIZE = 32
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
OUTPUT_DIR = os.path.join("..", "evaluation_metrics")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_trained_resnet():
    model_path = os.path.join("app", "ml_models", "bone_cancer_cnn.pth")
    checkpoint = torch.load(model_path, map_location=DEVICE)
    classes = checkpoint.get("classes", ["cancer", "normal"])

    model = models.resnet50(weights=None)
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(256, len(classes))
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()
    return model, classes

def run_evaluation():
    print("[INFO] Loading trained model and unseen test dataset...")
    model, classes = load_trained_resnet()

    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    test_path = os.path.join(DATA_DIR, "test")
    test_dataset = datasets.ImageFolder(test_path, transform=eval_transforms)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

    all_preds = []
    all_probs = []
    all_labels = []

    print("[INFO] Performing inference over test set...")
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            # Probability of malignancy (cancer is class 0)
            cancer_idx = classes.index("cancer") if "cancer" in classes else 0
            all_probs.extend(probs[:, cancer_idx].cpu().numpy())
            all_labels.extend(labels.numpy())

    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_labels = np.array(all_labels)

    # 1. Generate & Save Confusion Matrix Plot
    print("[INFO] Plotting Confusion Matrix...")
    cm = confusion_matrix(all_labels, all_preds)
    fig, ax = plt.subplots(figsize=(6, 5))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=classes)
    disp.plot(ax=ax, cmap="Blues", values_format="d")
    plt.title("BoneScan AI — CNN Confusion Matrix (Test Set)", fontsize=11, fontweight="bold", pad=12)
    plt.tight_layout()
    cm_path = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f" Saved: {cm_path}")

    # 2. Generate & Save ROC-AUC Curve
    print("[INFO] Computing ROC-AUC Curve...")
    # Convert labels so cancer = 1, normal = 0 for standard binary ROC
    binary_labels = np.where(all_labels == cancer_idx, 1, 0)
    fpr, tpr, _ = roc_curve(binary_labels, all_probs)
    roc_auc = auc(fpr, tpr)

    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color="#2563eb", lw=2, label=f"ResNet-50 ROC (AUC = {roc_auc:.4f})")
    plt.plot([0, 1], [0, 1], color="#94a3b8", lw=1.5, linestyle="--", label="Random Classifier")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=10, labelpad=8)
    plt.ylabel("True Positive Rate (Sensitivity)", fontsize=10, labelpad=8)
    plt.title("Receiver Operating Characteristic (ROC) Curve", fontsize=11, fontweight="bold", pad=12)
    plt.legend(loc="lower right", frameon=True)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    roc_path = os.path.join(OUTPUT_DIR, "roc_auc_curve.png")
    plt.savefig(roc_path, dpi=300)
    plt.close()
    print(f" Saved: {roc_path}")

    # 3. Print Final Academic Classification Report
    print("\n" + "=" * 55)
    print("FINAL BENCHMARK EVALUATION ON UNSEEN CLINICAL TEST SET")
    print("=" * 55)
    print(classification_report(all_labels, all_preds, target_names=classes, digits=4))
    print(f"Computed ROC-AUC Score: {roc_auc:.4f}")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    run_evaluation()