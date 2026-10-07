import os
import uuid
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User, Patient, Appointment, BiomarkerReport, XrayPrediction, CombinedPrediction

router = APIRouter(prefix="/receptionist", tags=["Receptionist Operations"])

UPLOAD_DIR = "uploads/xrays"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AppointmentBookingRequest(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime

@router.get("/doctors")
def list_active_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["receptionist", "doctor"]))
):
    # Only filter by role since 'is_active' does not exist in User model
    doctors = db.query(User).filter(User.role == "doctor").all()
    return [{"id": d.id, "name": d.name, "email": d.email} for d in doctors]

@router.get("/dashboard-stats")
def get_receptionist_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["receptionist", "doctor"]))
):
    total_patients = db.query(Patient).count()
    reviewed_ids = [p.patient_id for p in db.query(CombinedPrediction.patient_id).all()]
    pending_reviews = db.query(Patient).filter(~Patient.id.in_(reviewed_ids)).count() if reviewed_ids else total_patients

    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    today_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= today_start,
        Appointment.appointment_date <= today_end
    ).count()

    return {
        "total_patients": total_patients,
        "today_appointments": today_appointments,
        "pending_reviews": pending_reviews,
        "completed_reviews": total_patients - pending_reviews
    }

@router.get("/patients")
def get_all_patients_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["receptionist", "doctor"]))
):
    patients = db.query(Patient).order_by(Patient.id.desc()).all()
    results = []
    for p in patients:
        pred = db.query(CombinedPrediction).filter(CombinedPrediction.patient_id == p.id).first()
        appt = db.query(Appointment).filter(Appointment.patient_id == p.id).order_by(Appointment.appointment_date.desc()).first()
        doc = db.query(User).filter(User.id == appt.doctor_id).first() if appt else None

        results.append({
            "id": p.id,
            "patient_uid": p.patient_uid,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "phone": p.phone,
            "blood_group": p.blood_group,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "N/A",
            "assigned_doctor": doc.name if doc else "Not Assigned",
            "appointment_date": appt.appointment_date.strftime("%Y-%m-%d %I:%M %p") if appt else "Not Scheduled",
            "status": "Completed" if pred else "Pending Review",
            "risk_level": pred.risk_level if pred else "Awaiting Analysis"
        })
    return results

@router.post("/register-patient")
def register_patient_and_intake(
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    phone: str = Form(...),
    blood_group: str = Form(...),
    address: str = Form(None),
    alp: float = Form(...),
    opn: float = Form(...),
    vitamin_d: float = Form(...),
    pain_level: str = Form("MEDIUM"),
    xray_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["receptionist"]))
):
    count = db.query(Patient).count() + 1
    patient_uid = f"PAT-2026-{count:04d}"

    new_patient = Patient(
        patient_uid=patient_uid,
        name=name,
        age=age,
        gender=gender,
        phone=phone,
        blood_group=blood_group,
        address=address
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # Save X-ray scan
    file_ext = os.path.splitext(xray_file.filename)[1] or ".jpg"
    unique_filename = f"{patient_uid}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(xray_file.file.read())

    new_xray = XrayPrediction(
        patient_id=new_patient.id,
        image_path=file_path.replace("\\", "/"),
        cnn_prediction="Pending",
        confidence_score=0.0
    )
    db.add(new_xray)

    # Save Biomarkers
    new_biomarker = BiomarkerReport(
        patient_id=new_patient.id,
        alp=alp,
        opn=opn,
        vitamin_d=vitamin_d,
        pain_level=pain_level
    )
    db.add(new_biomarker)
    db.commit()

    return {
        "message": "Patient registered successfully",
        "patient_id": new_patient.id,
        "patient_uid": new_patient.patient_uid,
        "name": new_patient.name
    }

@router.post("/book-appointment")
def book_new_appointment(
    req: AppointmentBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["receptionist"]))
):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    doctor = db.query(User).filter(User.id == req.doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Assigned doctor does not exist")

    new_appt = Appointment(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        appointment_date=req.appointment_date,
        status="SCHEDULED"
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    return {
        "message": "Appointment scheduled successfully",
        "appointment_id": new_appt.id,
        "patient_name": patient.name,
        "doctor_name": doctor.name,
        "appointment_date": new_appt.appointment_date.strftime("%Y-%m-%d %I:%M %p")
    }