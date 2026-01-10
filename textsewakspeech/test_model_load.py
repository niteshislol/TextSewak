import os
from vosk import Model

path = os.path.join(os.getcwd(), "model")
print(f"Testing model at: {path}")

if os.path.exists(path):
    print(f"Files found: {os.listdir(path)}")
    try:
        model = Model(path)
        print("SUCCESS! Model loaded.")
    except Exception as e:
        print(f"FAILURE! Error: {e}")
else:
    print("FAILURE! Path does not exist.")
