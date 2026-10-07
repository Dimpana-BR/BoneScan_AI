from app.core.database import engine

def check_connection():
    try:
        connection = engine.connect()
        print(" Successfully connected to PostgreSQL database: bonescan_db")
        connection.close()
    except Exception as e:
        print(" Database connection failed:")
        print(e)

if __name__ == "__main__":
    check_connection()
    