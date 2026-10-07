import os
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import numpy as np

# Path configurations
DATA_DIR = "dataset"
BATCH_SIZE = 32
NUM_EPOCHS = 8          # Ideal for fine-tuning the classification head
LEARNING_RATE = 3e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_transforms():
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return train_transforms, eval_transforms

def build_research_model(num_classes=2):
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    
    # Freeze lower feature extractor layers to accelerate CPU throughput
    for name, param in model.named_parameters():
        if "layer4" not in name and "fc" not in name:
            param.requires_grad = False

    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(256, num_classes)
    )
    return model

def evaluate_test_set(model, test_loader, classes):
    model.eval()
    all_preds = []
    all_labels = []

    print("\n" + "="*50)
    print("RUNNING FINAL TEST SET EVALUATION (RESEARCH BENCHMARK)")
    print("="*50)

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    acc = accuracy_score(all_labels, all_preds)
    print(f"\nFinal Test Accuracy: {acc * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=classes, digits=4))
    
    cm = confusion_matrix(all_labels, all_preds)
    print("Confusion Matrix:")
    print(f"                Predicted {classes[0]}  Predicted {classes[1]}")
    print(f"Actual {classes[0]:<7} : {cm[0][0]:<15} {cm[0][1]}")
    print(f"Actual {classes[1]:<7} : {cm[1][0]:<15} {cm[1][1]}")
    print("="*50 + "\n")

def train():
    train_tf, eval_tf = get_transforms()

    train_path = os.path.join(DATA_DIR, "train")
    val_path = os.path.join(DATA_DIR, "valid")
    test_path = os.path.join(DATA_DIR, "test")

    train_dataset = datasets.ImageFolder(train_path, transform=train_tf)
    val_dataset = datasets.ImageFolder(val_path, transform=eval_tf)
    test_dataset = datasets.ImageFolder(test_path, transform=eval_tf)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

    classes = train_dataset.classes
    print(f"Detected Target Classes: {classes}")
    print(f"Dataset Partitioning -> Train: {len(train_dataset)} | Validation: {len(val_dataset)} | Test: {len(test_dataset)}")
    print(f"Hardware Compute Engine: {DEVICE}")

    model = build_research_model(num_classes=len(classes)).to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=LEARNING_RATE, weight_decay=1e-2)

    best_val_acc = 0.0
    output_model_path = os.path.join("app", "ml_models", "bone_cancer_cnn.pth")
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)

    total_batches = len(train_loader)

    for epoch in range(NUM_EPOCHS):
        start_time = time.time()
        model.train()
        running_loss, correct, processed = 0.0, 0, 0

        print(f"\n--- Epoch {epoch+1}/{NUM_EPOCHS} ---")
        for i, (images, labels) in enumerate(train_loader, 1):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data)
            processed += images.size(0)

            if i % 30 == 0 or i == total_batches:
                print(f"Batch [{i}/{total_batches}] - Loss: {loss.item():.4f} - Running Acc: {(correct.double()/processed)*100:.2f}%")

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = correct.double() / len(train_dataset)

        # Validation Phase
        model.eval()
        val_loss, val_correct = 0.0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data)

        val_loss = val_loss / len(val_dataset)
        val_acc = val_correct.double() / len(val_dataset)
        elapsed = time.time() - start_time

        print(f"Epoch {epoch+1} Summary: "
              f"Train Acc: {epoch_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Time: {elapsed:.1f}s")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'model_state_dict': model.state_dict(),
                'classes': classes
            }, output_model_path)
            print(f" ⭐ Best model checkpoint updated and saved to {output_model_path}")

    # Load best checkpoint and evaluate on unseen test set
    checkpoint = torch.load(output_model_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    evaluate_test_set(model, test_loader, classes)

if __name__ == "__main__":
    train()