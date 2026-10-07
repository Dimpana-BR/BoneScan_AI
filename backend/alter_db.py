from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check all existing tables in the public schema
    result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';"))
    tables = [row[0] for row in result]
    print(f"Detected tables in database: {tables}")

    target_table = None
    if "combined_predictions" in tables:
        target_table = "combined_predictions"
    elif "combined_prediction" in tables:
        target_table = "combined_prediction"

    if target_table:
        print(f"Modifying column sizes on table: '{target_table}'...")
        conn.execute(text(f"ALTER TABLE {target_table} ALTER COLUMN final_diagnosis TYPE TEXT;"))
        conn.execute(text(f"ALTER TABLE {target_table} ALTER COLUMN ai_recommendation TYPE TEXT;"))
        conn.execute(text(f"ALTER TABLE {target_table} ALTER COLUMN risk_level TYPE VARCHAR(50);"))
        conn.commit()
        print("Success! Database columns expanded to TEXT.")
    else:
        print("Table not found among public tables. Look at the detected table list printed above.")