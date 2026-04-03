"""Quick test: runs one WAV sample per emotion against the live API."""
import requests
import glob
import json

BASE = "http://localhost:5000/api"

# Login
r = requests.post(f"{BASE}/auth/login", json={"email": "test@test.com", "password": "Test1234!"})
token = r.json().get("token")
if not token:
    print("Login failed:", r.json())
    exit(1)
print(f"Login OK\n{'─'*55}")

headers = {"Authorization": f"Bearer {token}"}

correct = 0
total   = 0
for emotion in ["angry", "fear", "happy", "neutral", "sad"]:
    files = glob.glob(f"processed_audio/{emotion}/*.wav")
    if not files:
        print(f"  [SKIP] No files for {emotion}")
        continue

    with open(files[0], "rb") as f:
        r2 = requests.post(
            f"{BASE}/predict/live",
            headers=headers,
            files={"audio": ("test.wav", f, "audio/wav")},
            timeout=30,
        )

    if r2.status_code != 200:
        print(f"  [ERR]  {emotion}: HTTP {r2.status_code} — {r2.text[:80]}")
        continue

    result     = r2.json()
    predicted  = result.get("emotion", "?")
    confidence = result.get("confidence", 0)
    mark       = "OK   " if predicted == emotion else "WRONG"
    total += 1
    if predicted == emotion:
        correct += 1
    print(f"  [{mark}] Expected: {emotion:<8} -> Predicted: {predicted:<8} ({confidence}%)")

print(f"{'─'*55}")
print(f"  Result: {correct}/{total} correct ({100*correct//total if total else 0}%)")
