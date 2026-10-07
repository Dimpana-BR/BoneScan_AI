import os
from app.services.fusion_engine import DiagnosticFusionEngine

def verify_full_ai_engine():
    print("Initializing Multi-Modal Fusion Engine...")
    engine = DiagnosticFusionEngine()

    # Grab the first available test image from your dataset
    sample_dir = "dataset/test/cancer"
    if not os.path.exists(sample_dir):
        sample_dir = "dataset/test/normal"

    images = os.listdir(sample_dir)
    if not images:
        print("No test images found in dataset/test/ to verify.")
        return

    sample_img_path = os.path.join(sample_dir, images[0])
    output_gradcam = "uploads/gradcam/sample_test_gradcam.jpg"

    print(f"Running inference on sample X-ray: {sample_img_path}")
    result = engine.run_multimodal_fusion(
        image_path=sample_img_path,
        gradcam_save_path=output_gradcam,
        alp=280.5,
        opn=160.2,
        vit_d=12.4,
        pain_level="HIGH"
    )

    print("\n" + "="*50)
    print("MULTIMODAL DIAGNOSTIC INFERENCE RESULT")
    print("="*50)
    print(f"X-Ray CNN Prediction : {result['xray']['prediction']} (Confidence: {result['xray']['confidence_score']}%)")
    print(f"Biomarker Prediction : {result['biomarkers']['biomarker_prediction']} (Risk Score: {result['biomarkers']['biomarker_risk_score']})")
    print(f"Fused Multimodal Score: {result['fusion']['fused_score']}%")
    print(f"Calculated Risk Level : {result['fusion']['risk_level']}")
    print(f"Final AI Diagnosis    : {result['fusion']['final_diagnosis']}")
    print(f"GradCAM Heatmap Saved : {result['xray']['gradcam_path']}")
    print("="*50 + "\n")

if __name__ == "__main__":
    verify_full_ai_engine()