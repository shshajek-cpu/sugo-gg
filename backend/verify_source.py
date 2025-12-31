
import os
import sys
import logging
from app.adapter import get_adapter, DummySourceAdapter, ExternalSourceAdapter

# Configure logging to stdout
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("verification")

def verify_source():
    # 1. Check Module Type
    adapter = get_adapter()
    adapter_type = type(adapter).__name__
    
    print(f"\n[Verification Result]")
    print(f"Active Adapter Class: {adapter_type}")
    
    if isinstance(adapter, ExternalSourceAdapter):
        print("Conclusion: ➤ Real Data Mode (ExternalSourceAdapter)")
    elif isinstance(adapter, DummySourceAdapter):
        print("Conclusion: ➤ Dummy Data Mode (DummySourceAdapter)")
    else:
        print(f"Conclusion: ➤ Unknown Adapter ({adapter_type})")

    # 2. Check Data Characteristics
    print("\n[Data Sample Check]")
    try:
        # Request a random character to inspect data
        # '혼' is a top ranker confirmed in the ranking list
        char = adapter.get_character("Siel", "혼")
        print(f"Name: {char.name}")
        print(f"Level: {char.level}")
        print(f"Power: {char.power}")
        print(f"Class: {char.class_name}")
        
        # Analyze logical consistency
        if isinstance(adapter, DummySourceAdapter):
             print("\n[Analysis]")
             print("- Data generated algorithmically (Random Seed based)")
             print("- Level/Power are random within defined ranges")
        else:
             print("\n[Analysis]")
             print("- Data fetched from External URL")
             print("- Refelcts actual HTML/API response")

    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    verify_source()
