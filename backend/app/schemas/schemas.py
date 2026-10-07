from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# User Schemas
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

# Patient Schemas
class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
    address: Optional[str] = None
    blood_group: str
    doctor_id: int
    appointment_date: datetime

class PatientResponse(BaseModel):
    id: int
    patient_uid: str
    name: str
    age: int
    gender: str
    phone: str
    address: Optional[str]
    blood_group: str
    created_at: datetime

    class Config:
        from_attributes = True

# Biomarker Input & Output
class BiomarkerCreate(BaseModel):
    patient_id: int
    alp: float
    opn: float
    vitamin_d: float
    pain_level: str  # LOW, MEDIUM, HIGH

class BiomarkerResponse(BaseModel):
    id: int
    patient_id: int
    alp: float
    opn: float
    vitamin_d: float
    pain_level: str
    biomarker_risk_score: Optional[float]
    biomarker_prediction: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Prediction Schemas
class XrayPredictionResponse(BaseModel):
    id: int
    patient_id: int
    image_path: str
    gradcam_path: Optional[str]
    cnn_prediction: str
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class CombinedPredictionResponse(BaseModel):
    id: int
    patient_id: int
    fused_score: float
    final_diagnosis: str
    risk_level: str
    ai_recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True

# Doctor Notes
class DoctorNoteCreate(BaseModel):
    patient_id: int
    clinical_notes: str
    recommendation: str
    follow_up_date: Optional[datetime] = None

class DoctorNoteResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    clinical_notes: str
    recommendation: str
    follow_up_date: Optional[datetime]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Appointment View
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    status: str
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True