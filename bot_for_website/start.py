import subprocess
import time
import os
import sys

print("Starting Rasa Action Server on port 5055...", flush=True)
action_process = subprocess.Popen(
    ["rasa", "run", "actions", "--port", "5055"],
    stdout=sys.stdout,
    stderr=sys.stderr
)

print("Starting Rasa Core Server on port 5005...", flush=True)
core_process = subprocess.Popen(
    ["rasa", "run", "--enable-api", "--cors", "*", "--port", "5005"],
    stdout=sys.stdout,
    stderr=sys.stderr
)

print("Waiting for Rasa services to spin up...", flush=True)
time.sleep(12)

port = os.getenv("PORT", "8000")
print(f"Starting Web Connector (FastAPI) on port {port}...", flush=True)
connector_process = subprocess.Popen(
    ["uvicorn", "web_connector:app", "--host", "0.0.0.0", "--port", port],
    stdout=sys.stdout,
    stderr=sys.stderr
)

try:
    while True:
        if action_process.poll() is not None:
            print("Action server died. Exiting.", flush=True)
            sys.exit(1)
        if core_process.poll() is not None:
            print("Rasa Core server died. Exiting.", flush=True)
            sys.exit(1)
        if connector_process.poll() is not None:
            print("Web connector died. Exiting.", flush=True)
            sys.exit(1)
        time.sleep(2)
except KeyboardInterrupt:
    print("Terminating services...", flush=True)
    action_process.terminate()
    core_process.terminate()
    connector_process.terminate()
