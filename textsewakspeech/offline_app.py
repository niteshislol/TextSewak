import os
import sys
import json
import queue
import pyaudio
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from vosk import Model, KaldiRecognizer

app = Flask(__name__)
CORS(app)

# --- Configuration ---
MODEL_PATH = os.path.join(os.getcwd(), "model")  # Use absolute path
# ---------------------

model = None
try:
    print(f"DEBUG: Attempting to load model from: {MODEL_PATH}")
    if os.path.exists(MODEL_PATH):
        print(f"DEBUG: Path exists. Contents: {os.listdir(MODEL_PATH)}")
        model = Model(MODEL_PATH)
        print("Model loaded successfully!")
    else:
        print(f"ERROR: Model not found at '{MODEL_PATH}'. Please download it.")
except Exception as e:
    print(f"Error loading model: {e}")

def get_recognizer():
    if not model:
        return None
    rec = KaldiRecognizer(model, 16000)
    return rec

@app.route('/')
def index():
    return render_template('offline_index.html')

@app.route('/check_model')
def check_model():
    if model:
        return jsonify({"status": "ok"})
    return jsonify({"status": "error", "message": "Model not found. Please download 'vosk-model-hi-small-0.22' and extract it as 'model' folder."})

@app.route('/listen')
def listen():
    if not model:
        return jsonify({"text": "", "error": "Model not loaded"})

    rec = KaldiRecognizer(model, 16000)
    
    p = pyaudio.PyAudio()
    text = ""
    try:
        # Open microphone in BLOCKING mode (no callback)
        stream = p.open(format=pyaudio.paInt16,
                        channels=1,
                        rate=16000,
                        input=True,
                        frames_per_buffer=8000)
        
        print("Listening...")
        stream.start_stream()
        
        # Listen for up to 5 seconds
        for i in range(0, 20): # 20 chunks * 0.5s approx? No, 8000 frames at 16k is 0.5s. So 10 chunks = 5s
            data = stream.read(4000, exception_on_overflow=False)
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                if res['text']:
                    text = res['text']
                    break
        
        if not text:
            res = json.loads(rec.FinalResult())
            text = res['text']

        stream.stop_stream()
        stream.close()
    except Exception as e:
        print(f"Microphone error: {e}")
        return jsonify({"text": "", "error": str(e)})
    finally:
        p.terminate()

    print(f"Recognized: {text}")
    return jsonify({"text": text})

if __name__ == '__main__':
    print("Starting Offline FIR Generator...")
    print("Please open http://127.0.0.1:5056 in your browser")
    app.run(debug=True, port=5056)
