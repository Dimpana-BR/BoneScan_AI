from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User

DOCTORS_LIST = [
    {
        "name": "Dr. Sarah Johnson, Oncologist",
        "email": "doctor@bonescan.com",
        "password": "doctor123"
    },
    {
        "name": "Dr. Rajesh Sharma, Orthopedic Surgeon",
        "email": "sharma@bonescan.com",
        "password": "doctor123"
    },
    {
        "name": "Dr. Michael Chen, Musculoskeletal Radiologist",
        "email": "chen@bonescan.com",
        "password": "doctor123"
    },
    {
        "name": "Dr. Emily Davis, Pediatric Oncologist",
        "email": "davis@bonescan.com",
        "password": "doctor123"
    }
]

def seed_all_staff():
    db = SessionLocal()
    try:
        # 1. Receptionist check
        rec = db.query(User).filter(User.email == "receptionist@bonescan.com").first()
        if not rec:
            rec = User(
                name="Front Desk Receptionist",
                email="receptionist@bonescan.com",
                hashed_password=get_password_hash("receptionist123"),
                role="receptionist"
            )
            db.add(rec)
            print("Created: Front Desk Receptionist")

        # 2. Insert or update all doctors
        for doc_info in DOCTORS_LIST:
            existing_doc = db.query(User).filter(User.email == doc_info["email"]).first()
            if not existing_doc:
                new_doc = User(
                    name=doc_info["name"],
                    email=doc_info["email"],
                    hashed_password=get_password_hash(doc_info["password"]),
                    role="doctor"
                )
                db.add(new_doc)
                print(f"Created Doctor: {doc_info['name']} ({doc_info['email']})")
            else:
                existing_doc.name = doc_info["name"]
                existing_doc.hashed_password = get_password_hash(doc_info["password"])
                print(f"Updated Doctor: {doc_info['name']}")

        db.commit()
        print("\nAll doctors seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding doctors: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_staff()