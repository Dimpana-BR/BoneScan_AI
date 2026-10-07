from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    RECEPTIONIST = "receptionist"
    DOCTOR = "doctor"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PainLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="doctor")
    doctor_notes = relationship("DoctorNote", back_populates="doctor")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_uid = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    biomarkers = relationship("BiomarkerReport", back_populates="patient", cascade="all, delete-orphan")
    xrays = relationship("XrayPrediction", back_populates="patient", cascade="all, delete-orphan")
    combined_predictions = relationship("CombinedPrediction", back_populates="patient", cascade="all, delete-orphan")
    notes = relationship("DoctorNote", back_populates="patient", cascade="all, delete-orphan")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(30), default="SCHEDULED")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", back_populates="appointments")

class BiomarkerReport(Base):
    __tablename__ = "biomarker_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Clinical Biomarkers & Symptoms
    alp = Column(Float, nullable=False)                 # Alkaline Phosphatase (U/L)
    opn = Column(Float, nullable=False)                 # Osteopontin (ng/mL)
    vitamin_d = Column(Float, nullable=False)           # 25-OH Vitamin D (ng/mL)
    pain_level = Column(String(20), default="LOW")      # LOW, MEDIUM, HIGH
    
    # Model Output
    biomarker_risk_score = Column(Float, nullable=True) # 0.0 to 1.0 probability
    biomarker_prediction = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="biomarkers")

class XrayPrediction(Base):
    __tablename__ = "xray_predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    gradcam_path = Column(String(255), nullable=True)
    cnn_prediction = Column(String(30), nullable=False)
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="xrays")

class CombinedPrediction(Base):
    __tablename__ = "combined_predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    fused_score = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    final_diagnosis = Column(Text, nullable=False)       # Changed to Text
    ai_recommendation = Column(Text, nullable=False)     # Changed to Text
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="combined_predictions")

class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinical_notes = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    follow_up_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="APPROVED")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="notes")
    doctor = relationship("User", back_populates="doctor_notes")