import os
import shutil
from sentence_transformers import SentenceTransformer

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_NAME)

def download_and_save_model():
    print(f"Checking for model at: {MODEL_PATH}")
    
    if os.path.exists(MODEL_PATH):
        print("✔ Model directory already exists. Skipping download.")
        return

    print(f"⬇ Downloading model '{MODEL_NAME}' (Internet Required)...")
    try:
        # Load from Hub
        model = SentenceTransformer(MODEL_NAME)
        
        # Save to local directory
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)
            
        print(f"Saving model to {MODEL_PATH}...")
        model.save(MODEL_PATH)
        print("✔ Model saved successfully!")
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print("Please ensure you have an active internet connection.")

if __name__ == "__main__":
    download_and_save_model()
