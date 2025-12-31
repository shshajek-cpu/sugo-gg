import sys
import os
import asyncio
import logging
from typing import Optional

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ValidationScript")

# Mock Environment Variables for Testing
os.environ["SOURCE_ADAPTER_TYPE"] = "external"
os.environ["EXTERNAL_CONNECT_TIMEOUT"] = "2.0"
os.environ["EXTERNAL_READ_TIMEOUT"] = "2.0"
os.environ["EXTERNAL_MAX_RETRIES"] = "2"
os.environ["EXTERNAL_RETRY_MIN_WAIT"] = "1"
os.environ["EXTERNAL_CACHE_ENABLED"] = "false" # Disable cache for raw testing

from app.adapter import ExternalSourceAdapter, AdapterConfig, ExternalSourceTimeoutError, ExternalSourceHTTPError, SourceAdapterError

def run_test_case(name: str, url: str, expected_exception: Optional[type] = None):
    print(f"\n--- Testing Case: {name} ---")
    print(f"Target URL: {url}")
    
    # Override URL locally for the adapter
    original_url = AdapterConfig.EXTERNAL_BASE_URL
    AdapterConfig.EXTERNAL_BASE_URL = url
    
    adapter = ExternalSourceAdapter()
    
    try:
        # Using "dummy" server/name because we are testing the network/protocol layer
        result = adapter.get_character("TEST", "USER")
        if expected_exception:
            print(f"❌ FAILED: Expected {expected_exception.__name__}, but got success.")
        else:
            print(f"✅ PASSED: Success (Got {result.name})")
            
    except Exception as e:
        if expected_exception and isinstance(e, expected_exception):
            print(f"✅ PASSED: Caught expected exception: {type(e).__name__}")
            print(f"   Message: {e}")
        elif expected_exception:
            print(f"❌ FAILED: Expected {expected_exception.__name__}, but got {type(e).__name__}")
            print(f"   Message: {e}")
        else:
            print(f"❌ FAILED: Unexpected exception: {type(e).__name__}")
            print(f"   Message: {e}")
    finally:
        # Restore URL
        AdapterConfig.EXTERNAL_BASE_URL = original_url

def main():
    print("🚀 Starting External Source Adapter Validation (Real Data / Network)")
    print("Note: Using httpbin.org to simulate network conditions.\n")

    # 1. Test Timeout (Simulating Slow Connection)
    # httpbin.org/delay/3 waits 3 seconds. Our timeout is 2.0s. Should Fail.
    run_test_case(
        "Timeout Handling (Blocking)",
        "https://httpbin.org/delay/3",
        expected_exception=ExternalSourceTimeoutError
    )

    # 2. Test HTTP 429 (Rate Limit / Blocking)
    run_test_case(
        "Rate Limit Handling (External Block)",
        "https://httpbin.org/status/429",
        expected_exception=ExternalSourceHTTPError
    )

    # 3. Test HTTP 500 (Abnormal Server Error)
    run_test_case(
        "Server Error Handling (Abnormal)",
        "https://httpbin.org/status/500",
        expected_exception=ExternalSourceHTTPError
    )

    # 4. Test Success (JSON)
    # httpbin.org/json returns a sample JSON. Our parser might fail on structure, 
    # but we should at least get a Response and try to parse it.
    # We expect ExternalSourceParseError because the JSON structure won't match CharacterDTO
    from app.adapter import ExternalSourceParseError
    run_test_case(
        "Response Parsing (Structure Check)",
        "https://httpbin.org/json",
        expected_exception=ExternalSourceParseError 
    )

    print("\n✅ Validation Complete.")

if __name__ == "__main__":
    main()
