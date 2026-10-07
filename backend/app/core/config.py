import urllib.parse
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BoneScan AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "bonescan_db"
    POSTGRES_PORT: str = "5432"

    SECRET_KEY: str = "super-secret-hospital-grade-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    UPLOAD_DIR: str = "uploads"
    XRAY_UPLOAD_DIR: str = "uploads/xrays"
    GRADCAM_UPLOAD_DIR: str = "uploads/gradcam"
    REPORT_UPLOAD_DIR: str = "uploads/reports"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Safely encode special characters (like @, #, $, etc.) in the password
        encoded_password = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql://{self.POSTGRES_USER}:{encoded_password}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()