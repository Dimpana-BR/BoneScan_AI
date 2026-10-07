import os
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import (
    User,
    Patient,
    Appointment,
    BiomarkerReport,
    XrayPrediction,
    CombinedPrediction,
    DoctorNote
)
from app.services.fusion_engine import run_multimodal_pipeline
from app.services.pdf_report import generate_patient_pdf

router = APIRouter(prefix="/doctor", tags=["Doctor Clinical Operations"])

class DoctorNotesRequest(BaseModel):
    patient_id: int
    clinical_notes: str
    recommendation: str
    follow_up_date: datetime | None = None

@router.get("/dashboard-stats")
def get_doctor_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    today_appts = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.appointment_date >= today_start,
        Appointment.appointment_date <= today_end
    ).all()

    today_patient_ids = [a.patient_id for a in today_appts]

    completed_today_count = db.query(CombinedPrediction).filter(
        CombinedPrediction.patient_id.in_(today_patient_ids)
    ).count() if today_patient_ids else 0

    pending_today_count = len(today_patient_ids) - completed_today_count

    total_assigned_all_time = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id
    ).count()

    return {
        "today_total": len(today_patient_ids),
        "today_pending": pending_today_count,
        "today_completed": completed_today_count,
        "total_assigned": total_assigned_all_time
    }

@router.get("/today-patients")
def get_today_scheduled_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    results = (
        db.query(
            Patient.id.label("patient_id"),
            Patient.patient_uid,
            Patient.name,
            Patient.age,
            Patient.gender,
            Patient.phone,
            Appointment.appointment_date,
            CombinedPrediction.risk_level,
            CombinedPrediction.fused_score
        )
        .join(Appointment, Appointment.patient_id == Patient.id)
        .outerjoin(CombinedPrediction, CombinedPrediction.patient_id == Patient.id)
        .filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date <= today_end
        )
        .order_by(Appointment.appointment_date.asc())
        .all()
    )

    data = []
    for r in results:
        data.append({
            "patient_id": r.patient_id,
            "patient_uid": r.patient_uid,
            "name": r.name,
            "age": r.age,
            "gender": r.gender,
            "phone": r.phone,
            "appointment_time": r.appointment_date.strftime("%I:%M %p") if r.appointment_date else "N/A",
            "status": "Completed" if r.risk_level else "Pending Review",
            "risk_level": r.risk_level if r.risk_level else "Awaiting Analysis",
            "fused_score": r.fused_score
        })
    return data

@router.get("/patients")
def get_assigned_patients(
    scope: str = "my",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    query = (
        db.query(
            Patient.id.label("patient_id"),
            Patient.patient_uid,
            Patient.name,
            Patient.age,
            Patient.gender,
            Appointment.appointment_date,
            Appointment.doctor_id,
            CombinedPrediction.risk_level,
            CombinedPrediction.fused_score,
            XrayPrediction.image_path,
            XrayPrediction.gradcam_path
        )
        .outerjoin(Appointment, Appointment.patient_id == Patient.id)
        .outerjoin(CombinedPrediction, CombinedPrediction.patient_id == Patient.id)
        .outerjoin(XrayPrediction, XrayPrediction.patient_id == Patient.id)
    )

    if scope == "my":
        query = query.filter(Appointment.doctor_id == current_user.id)

    results = query.order_by(Appointment.appointment_date.desc()).all()

    patient_list = []
    seen = set()
    for r in results:
        if r.patient_id in seen:
            continue
        seen.add(r.patient_id)
        patient_list.append({
            "patient_id": r.patient_id,
            "patient_uid": r.patient_uid,
            "name": r.name,
            "age": r.age,
            "gender": r.gender,
            "appointment_date": r.appointment_date.strftime("%Y-%m-%d %I:%M %p") if r.appointment_date else "Not Scheduled",
            "risk_level": r.risk_level if r.risk_level else "Pending",
            "fused_score": r.fused_score,
            "has_xray": bool(r.image_path),
            "has_gradcam": bool(r.gradcam_path)
        })

    return patient_list

@router.get("/patient/{patient_id}")
def get_patient_clinical_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    biomarkers = db.query(BiomarkerReport).filter(BiomarkerReport.patient_id == patient_id).first()
    xray = db.query(XrayPrediction).filter(XrayPrediction.patient_id == patient_id).first()
    prediction = db.query(CombinedPrediction).filter(CombinedPrediction.patient_id == patient_id).first()
    doctor_note = db.query(DoctorNote).filter(DoctorNote.patient_id == patient_id).first()

    return {
        "patient": {
            "id": patient.id,
            "patient_uid": patient.patient_uid,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "blood_group": patient.blood_group,
            "address": patient.address
        },
        "biomarkers": {
            "alp": biomarkers.alp if biomarkers else None,
            "opn": biomarkers.opn if biomarkers else None,
            "vitamin_d": biomarkers.vitamin_d if biomarkers else None,
            "pain_level": biomarkers.pain_level if biomarkers else None,
            "biomarker_risk_score": biomarkers.biomarker_risk_score if biomarkers else None,
            "biomarker_prediction": biomarkers.biomarker_prediction if biomarkers else None
        } if biomarkers else None,
        "xray": {
            "image_path": xray.image_path if xray else None,
            "gradcam_path": xray.gradcam_path if xray else None,
            "cnn_prediction": xray.cnn_prediction if xray else None,
            "confidence_score": xray.confidence_score if xray else None
        } if xray else None,
        "prediction": {
            "fused_score": prediction.fused_score if prediction else None,
            "risk_level": prediction.risk_level if prediction else None,
            "final_diagnosis": prediction.final_diagnosis if prediction else None,
            "ai_recommendation": prediction.ai_recommendation if prediction else None
        } if prediction else None,
        "doctor_notes": {
            "clinical_notes": doctor_note.clinical_notes if doctor_note else "",
            "recommendation": doctor_note.recommendation if doctor_note else "",
            "follow_up_date": doctor_note.follow_up_date.strftime("%Y-%m-%d") if doctor_note and doctor_note.follow_up_date else None
        } if doctor_note else None
    }

@router.post("/run-analysis/{patient_id}")
def execute_ai_analysis(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    try:
        result = run_multimodal_pipeline(patient_id, db)
        return {"message": "AI multimodal screening successfully executed", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic pipeline error: {str(e)}")

@router.post("/add-notes")
def save_doctor_clinical_notes(
    req: DoctorNotesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    note = db.query(DoctorNote).filter(DoctorNote.patient_id == req.patient_id).first()
    if note:
        note.doctor_id = current_user.id
        note.clinical_notes = req.clinical_notes
        note.recommendation = req.recommendation
        note.follow_up_date = req.follow_up_date
    else:
        note = DoctorNote(
            patient_id=req.patient_id,
            doctor_id=current_user.id,
            clinical_notes=req.clinical_notes,
            recommendation=req.recommendation,
            follow_up_date=req.follow_up_date
        )
        db.add(note)

    db.commit()
    return {"message": "Consultation record signed successfully"}

@router.get("/report/{patient_id}")
def download_patient_oncology_report(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    biomarkers = db.query(BiomarkerReport).filter(BiomarkerReport.patient_id == patient_id).first()
    xray = db.query(XrayPrediction).filter(XrayPrediction.patient_id == patient_id).first()
    prediction = db.query(CombinedPrediction).filter(CombinedPrediction.patient_id == patient_id).first()
    notes = db.query(DoctorNote).filter(DoctorNote.patient_id == patient_id).first()

    # Destination folder for compiled PDF dossiers
    reports_dir = os.path.join("reports")
    os.makedirs(reports_dir, exist_ok=True)
    output_pdf_path = os.path.join(reports_dir, f"{patient.patient_uid}_Report.pdf")

    try:
        # Call generate_patient_pdf with all required positional arguments
        generate_patient_pdf(
            patient=patient,
            biomarker=biomarkers,
            xray=xray,
            prediction=prediction,
            notes=notes,
            output_pdf_path=output_pdf_path
        )
    except TypeError:
        # Fallback if your pdf_report.py has a slightly different argument order:
        generate_patient_pdf(
            patient,
            biomarkers,
            xray,
            prediction,
            notes,
            output_pdf_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {str(e)}")

    if not os.path.exists(output_pdf_path):
        raise HTTPException(status_code=404, detail="Medical dossier file not found on server")

    filename = os.path.basename(output_pdf_path)
    return FileResponse(
        path=output_pdf_path,
        media_type="application/pdf",
        filename=filename
    )