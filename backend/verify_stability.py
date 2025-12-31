
import asyncio
import os
import redis
from unittest.mock import MagicMock, patch
from app.adapter import ExternalSourceAdapter, AdapterConfig, SourceAdapterError
from app.schemas import CharacterDTO
import httpx
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Mock Config
AdapterConfig.REDIS_URL = "redis://localhost:6379/0"
AdapterConfig.CONNECT_TIMEOUT = 1.0
AdapterConfig.READ_TIMEOUT = 1.0

def test_success_mock():
    logger.info("--- TEST: Success (Mock) ---")
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "application/json"}
    mock_response.json.return_value = {"name": "TestChar", "server": "Siel", "class": "Warrior", "level": 60, "power": 12345}
    mock_response.text = '{"name": "TestChar"}'

    with patch('httpx.Client.get', return_value=mock_response):
        adapter = ExternalSourceAdapter()
        try:
            result = adapter.get_character("Siel", "TestChar")
            if result.name == "TestChar" and result.power == 12345:
                logger.info("✅ Success: Data parsed correctly")
            else:
                logger.error(f"❌ Failure: Data mismatch {result}")
        except Exception as e:
            logger.error(f"❌ Failure: Unexpected exception {e}")

def test_timeout_mock():
    logger.info("--- TEST: Timeout (Mock) ---")
    with patch('httpx.Client.get', side_effect=httpx.TimeoutException("Mock Timeout")):
        adapter = ExternalSourceAdapter()
        try:
            adapter.get_character("Siel", "SlowChar")
            logger.error("❌ Failure: Should have raised exception")
        except SourceAdapterError as e:
            logger.info(f"✅ Success: Caught expected exception: {e}")
        except Exception as e:
            logger.error(f"❌ Failure: Caught wrong exception type: {type(e)}")

def test_http_error_mock():
    logger.info("--- TEST: HTTP 500 Error (Mock) ---")
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError("500 Error", request=MagicMock(), response=mock_response)
    
    with patch('httpx.Client.get', return_value=mock_response):
        adapter = ExternalSourceAdapter()
        try:
            adapter.get_character("Siel", "ErrorChar")
            logger.error("❌ Failure: Should have raised exception")
        except SourceAdapterError as e:
            logger.info(f"✅ Success: Caught expected exception: {e}")

def test_parse_error_mock():
    logger.info("--- TEST: Parse Error (Mock HTML Garbage) ---")
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "text/html"}
    mock_response.text = "<html><body><h1>No Data Here</h1></body></html>"
    
    with patch('httpx.Client.get', return_value=mock_response):
        adapter = ExternalSourceAdapter()
        try:
            adapter.get_character("Siel", "GarbageChar")
            logger.error("❌ Failure: Should have raised exception")
        except SourceAdapterError as e:
            logger.info(f"✅ Success: Caught expected exception: {e}")

def test_rate_limit():
    logger.info("--- TEST: Rate Limit ---")
    # Clean Redis first
    r = redis.from_url(AdapterConfig.REDIS_URL, decode_responses=True)
    r.flushdb()
    
    # Mock Success for this test
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "application/json"}
    mock_response.json.return_value = {"name": "SpamChar", "server": "Siel", "class": "Mage", "level": 10, "power": 100}
    
    with patch('httpx.Client.get', return_value=mock_response):
        adapter = ExternalSourceAdapter()
        try:
            # 1st Call - OK
            adapter.get_character("Siel", "SpamChar")
            logger.info("✅ 1st Call OK")
            
            # 2nd Call - Should Fail (Window 60s)
            adapter.get_character("Siel", "SpamChar")
            logger.error("❌ Failure: Rate limit didn't trigger")
        except SourceAdapterError as e:
            if "Rate limit" in str(e):
                logger.info(f"✅ Success: Rate limit triggered: {e}")
            else:
                logger.error(f"❌ Failure: Wrong error: {e}")

if __name__ == "__main__":
    print("=== Starting Service Stability Verification ===")
    try:
        test_success_mock()
        test_timeout_mock()
        test_http_error_mock()
        test_parse_error_mock()
        test_rate_limit()
        print("\n=== Verification Completed ===")
    except ImportError:
        print("❌ Dependencies missing. Please run inside backend environment.")
