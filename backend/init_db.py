from app.core.database import engine, SessionLocal, Base
from app.models.models import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_tables_and_seed():
    print("Creating all tables in bonescan_db...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if users already exist
        receptionist_exists = db.query(User).filter(User.email == "receptionist@bonescan.com").first()
        doctor_exists = db.query(User).filter(User.email == "doctor@bonescan.com").first()

        if not receptionist_exists:
            receptionist = User(
                name="Front Desk Admin",
                email="receptionist@bonescan.com",
                hashed_password=pwd_context.hash("receptionist123"),
                role=UserRole.RECEPTIONIST.value
            )
            db.add(receptionist)
            print("Added default receptionist: receptionist@bonescan.com / receptionist123")

        if not doctor_exists:
            doctor = User(
                name="Dr. Sarah Johnson, Oncologist",
                email="doctor@bonescan.com",
                hashed_password=pwd_context.hash("doctor123"),
                role=UserRole.DOCTOR.value
            )
            db.add(doctor)
            print("Added default doctor: doctor@bonescan.com / doctor123")

        db.commit()
        print("Database initialized and seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_tables_and_seed()