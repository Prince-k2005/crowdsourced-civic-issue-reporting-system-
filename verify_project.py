import requests
import json
import time

# Configuration
API_URL = "http://localhost:8000"

def test_health():
    print(f"Checking health at {API_URL}/health ...")
    try:
        res = requests.get(f"{API_URL}/health", timeout=2)
        if res.status_code == 200:
            print("Backend is UP")
            return True
        else:
            print(f"Backend returned {res.status_code}")
            return False
    except Exception as e:
        print(f"Backend unreachable: {e}")
        return False

def test_submission():
    print("\nChecking public API endpoint /api/leaderboard/stats ...")
    try:
        res = requests.get(f"{API_URL}/api/leaderboard/stats", timeout=5)
        if res.status_code == 200:
            print("Leaderboard stats endpoint is UP")
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"Stats endpoint failed: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Error during endpoint check: {e}")

if __name__ == "__main__":
    print("--- CivicFlow End-to-End Verification Script ---")
    if test_health():
        test_submission()
    else:
        print("\nPlease ensure the backend is running via 'docker-compose up' or 'uvicorn app.main:app --reload'.")
