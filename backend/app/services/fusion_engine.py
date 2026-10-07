import os
import cv2
import joblib
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import pandas as pd

from app.models.models import Patient, BiomarkerReport, XrayPrediction, CombinedPrediction
from app.services.gradcam import GradCAM, overlay_heatmap

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CNN_WEIGHTS_PATH = os.path.join("app", "ml_models", "bone_cancer_cnn.pth")
RF_MODEL_PATH = os.path.join("app", "ml_models", "biomarker_rf_model.joblib")
SCALER_PATH = os.path.join("app", "ml_models", "biomarker_scaler.joblib")
GRADCAM_DIR = os.path.join("uploads", "gradcam")
os.makedirs(GRADCAM_DIR, exist_ok=True)

# 1. Load ResNet-50 CNN
def load_cnn_model():
    checkpoint = torch.load(CNN_WEIGHTS_PATH, map_location=DEVICE)
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

# 2. Main Multimodal Execution Function
def run_multimodal_pipeline(patient_id: int, db):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    xray = db.query(XrayPrediction).filter(XrayPrediction.patient_id == patient_id).first()
    biomarker = db.query(BiomarkerReport).filter(BiomarkerReport.patient_id == patient_id).first()

    if not xray or not os.path.exists(xray.image_path):
        raise FileNotFoundError(f"Radiograph scan missing for patient ID {patient_id}")
    if not biomarker:
        raise ValueError(f"Serological biomarker records missing for patient ID {patient_id}")

    # --- Part A: X-Ray CNN Inference ---
    model, classes = load_cnn_model()
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    pil_img = Image.open(xray.image_path).convert("RGB")
    tensor_img = transform(pil_img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(tensor_img)
        probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]
        cancer_idx = classes.index("cancer") if "cancer" in classes else 0
        p_xray_cancer = float(probs[cancer_idx])

    pred_label = "cancer" if p_xray_cancer >= 0.50 else "normal"
    confidence_val = round((p_xray_cancer if pred_label == "cancer" else (1.0 - p_xray_cancer)) * 100, 2)

    # --- Part B: Grad-CAM (Targeted strictly to malignancy) ---
    gradcam_rel_path = None
    if pred_label == "cancer":
        cam_generator = GradCAM(model)
        cam_mask = cam_generator.generate(tensor_img, class_idx=cancer_idx)
        raw_bgr = cv2.imread(xray.image_path)
        overlay = overlay_heatmap(raw_bgr, cam_mask)
        
        gradcam_filename = f"gradcam_{os.path.basename(xray.image_path)}"
        gradcam_full_path = os.path.join(GRADCAM_DIR, gradcam_filename)
        cv2.imwrite(gradcam_full_path, overlay)
        gradcam_rel_path = gradcam_full_path.replace("\\", "/")

    # Update X-ray record
    xray.cnn_prediction = pred_label
    xray.confidence_score = confidence_val
    xray.gradcam_path = gradcam_rel_path

    # --- Part C: Biomarker Random Forest Inference ---
   # --- Part C: Biomarker Random Forest Inference ---
    import pandas as pd

    rf_classifier = joblib.load(RF_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    pain_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
    pain_num = pain_map.get(str(biomarker.pain_level).upper(), 2)

    # Dictionary containing all possible casing / variations
    val_map = {
        "ALP": biomarker.alp,
        "alp": biomarker.alp,
        "OPN": biomarker.opn,
        "opn": biomarker.opn,
        "Vitamin_D": biomarker.vitamin_d,
        "vitamin_d": biomarker.vitamin_d,
        "Vit_D": biomarker.vitamin_d,
        "Pain_Level": pain_num,
        "pain_level": pain_num,
        "Pain": pain_num
    }

    # Dynamically extract the exact column names and order used during model fitting
    if hasattr(scaler, "feature_names_in_"):
        feature_order = list(scaler.feature_names_in_)
        row_values = [val_map.get(col, 0) for col in feature_order]
        raw_bio_df = pd.DataFrame([row_values], columns=feature_order)
        scaled_bio = scaler.transform(raw_bio_df)
    else:
        # Fallback to numpy array without feature names if unavailable
        raw_features = np.array([[biomarker.alp, biomarker.opn, biomarker.vitamin_d, pain_num]])
        scaled_bio = scaler.transform(raw_features)

    rf_probs = rf_classifier.predict_proba(scaled_bio)[0]
    p_bio_cancer = float(rf_probs[1]) if len(rf_probs) > 1 else float(rf_probs[0])
    
    biomarker.biomarker_risk_score = 1 if p_bio_cancer >= 0.50 else 0
    biomarker.biomarker_prediction = "Elevated Risk" if p_bio_cancer >= 0.50 else "Normal / Low Risk"

    # --- Part D: Late-Fusion Calculation (65% X-Ray, 35% Biomarkers) ---
    fused_cancer_prob = (0.65 * p_xray_cancer) + (0.35 * p_bio_cancer)
    fused_score_pct = round(fused_cancer_prob * 100, 2)

    if fused_cancer_prob >= 0.80:
        risk_level = "CRITICAL"
        final_diag = "Malignant Neoplasm Highly Suspected"
        rec = "Immediate orthopedic oncology consult and percutaneous core biopsy required."
    elif fused_cancer_prob >= 0.55:
        risk_level = "HIGH"
        final_diag = "Suspicious Osteolytic/Osteoblastic Lesion"
        rec = "Priority referral for 3T contrast-enhanced MRI and repeat serological panel."
    elif fused_cancer_prob >= 0.35:
        risk_level = "MODERATE"
        final_diag = "Inconclusive / Indeterminate Bone Abnormality"
        rec = "Correlate with previous trauma; repeat radiographic screening in 4 weeks."
    else:
        risk_level = "LOW"
        final_diag = "Normal Skeletal Findings"
        rec = "Benign or non-neoplastic etiology. Routine orthopedic follow-up as indicated."

    # Update or insert CombinedPrediction
    # Update or insert CombinedPrediction
    combined = db.query(CombinedPrediction).filter(CombinedPrediction.patient_id == patient_id).first()
    if combined:
        combined.fused_score = fused_score_pct
        combined.risk_level = risk_level
        combined.final_diagnosis = final_diag[:250]
        combined.ai_recommendation = rec[:500]
    else:
        combined = CombinedPrediction(
            patient_id=patient_id,
            fused_score=fused_score_pct,
            risk_level=risk_level,
            final_diagnosis=final_diag[:250],
            ai_recommendation=rec[:500]
        )
        db.add(combined)

    db.commit()
    db.refresh(xray)
    db.refresh(biomarker)
    db.refresh(combined)

    return {
        "cnn_prediction": pred_label,
        "confidence_score": confidence_val,
        "biomarker_prediction": biomarker.biomarker_prediction,
        "risk_level": risk_level,
        "fused_score": fused_score_pct,
        "final_diagnosis": final_diag,
        "ai_recommendation": rec,
        "gradcam_path": gradcam_rel_path
    }