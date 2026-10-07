import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

def generate_clinical_biomarker_data(n_samples=2500, random_state=42):
    np.random.seed(random_state)
    
    # 0 = Normal / Non-Cancerous, 1 = Bone Cancer Risk
    labels = np.random.choice([0, 1], size=n_samples, p=[0.55, 0.45])
    
    # Normal reference ranges:
    # ALP: 44 - 147 U/L
    # OPN: 15 - 55 ng/mL
    # Vitamin D: 30 - 100 ng/mL
    # Pain level: Mostly Low (0) or Medium (1)
    
    # Malignant reference ranges:
    # ALP: 180 - 650+ U/L (Markedly elevated in osteoblastic lesions)
    # OPN: 75 - 280 ng/mL (Significantly elevated in bone metastasis)
    # Vitamin D: 8 - 25 ng/mL (Depleted)
    # Pain level: Mostly Medium (1) or High (2)

    alp = np.where(labels == 0, 
                   np.random.normal(loc=95, scale=25, size=n_samples), 
                   np.random.normal(loc=320, scale=80, size=n_samples))
    alp = np.clip(alp, 30, 800)

    opn = np.where(labels == 0, 
                   np.random.normal(loc=38, scale=12, size=n_samples), 
                   np.random.normal(loc=140, scale=40, size=n_samples))
    opn = np.clip(opn, 10, 400)

    vit_d = np.where(labels == 0, 
                     np.random.normal(loc=45, scale=12, size=n_samples), 
                     np.random.normal(loc=17, scale=6, size=n_samples))
    vit_d = np.clip(vit_d, 5, 120)

    # Pain Level: 0=Low, 1=Medium, 2=High
    pain_level = []
    for lbl in labels:
        if lbl == 0:
            pain_level.append(np.random.choice([0, 1, 2], p=[0.70, 0.25, 0.05]))
        else:
            pain_level.append(np.random.choice([0, 1, 2], p=[0.08, 0.32, 0.60]))

    df = pd.DataFrame({
        "ALP": np.round(alp, 2),
        "OPN": np.round(opn, 2),
        "Vitamin_D": np.round(vit_d, 2),
        "Pain_Level": pain_level,
        "Target": labels
    })
    return df

def train_and_export_model():
    print("Generating biomarker training dataset (ALP, OPN, Vitamin D, Pain Level)...")
    data = generate_clinical_biomarker_data()
    
    # Save CSV for reference
    os.makedirs("app/ml_models", exist_ok=True)
    data.to_csv("app/ml_models/biomarker_dataset.csv", index=False)
    print("Saved biomarker reference CSV to app/ml_models/biomarker_dataset.csv")

    X = data[["ALP", "OPN", "Vitamin_D", "Pain_Level"]]
    y = data["Target"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Training Random Forest Classifier...")
    rf_classifier = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    rf_classifier.fit(X_train_scaled, y_train)

    # Validation
    predictions = rf_classifier.predict(X_test_scaled)
    acc = accuracy_score(y_test, predictions)
    print(f"\nModel Training Complete! Test Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, predictions, target_names=["Normal", "Cancer Risk"]))

    # Export models
    model_path = os.path.join("app", "ml_models", "biomarker_rf_model.joblib")
    scaler_path = os.path.join("app", "ml_models", "biomarker_scaler.joblib")
    
    joblib.dump(rf_classifier, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Saved model to {model_path}")
    print(f"Saved scaler to {scaler_path}")

if __name__ == "__main__":
    train_and_export_model()