"""
Database Migration for AION2 Extended Data

Adds new columns for: race, legion, titles_data, ranking_data, 
pet_wings_data, skills_data, stigma_data, devanion_data, arcana_data
"""

from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db/aion2")

def migrate():
    engine = create_engine(DATABASE_URL)
    
    columns_to_add = [
        ("race", "VARCHAR(32)"),
        ("legion", "VARCHAR(64)"),
        ("titles_data", "JSONB"),
        ("ranking_data", "JSONB"),
        ("pet_wings_data", "JSONB"),
        ("skills_data", "JSONB"),
        ("stigma_data", "JSONB"),
        ("devanion_data", "JSONB"),
        ("arcana_data", "JSONB"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                print(f"Adding column: {col_name} ({col_type})")
                conn.execute(text(f"ALTER TABLE characters ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  ✓ Added {col_name}")
            except Exception as e:
                print(f"  ⚠ Skipping {col_name}: {e}")
    
    print("\n✓ Migration completed!")

if __name__ == "__main__":
    migrate()
