# TextSewak-OCR 🇮🇳

**TextSewak** is an advanced Offline OCR and Legal Assistance platform designed specifically for Indian law enforcement and legal professionals. It combines powerful client-side processing with specialized offline capabilities to ensure data privacy, speed, and reliability without persistent internet dependence.

![TextSewak Architecture](Document/textsewak_architecture_diagram.png)
*(Generate a visual using the prompt in `Document/SYSTEM_PIPELINE.md`)*

## 🚀 Key Features

### 1. 📝 Intelligent OCR (Optical Character Recognition)
*   **Offline Processing**: Runs entirely in the browser using WebAssembly (Tesseract.js).
*   **Multi-Format Support**: Extracts text from Images (JPG, PNG) and PDF documents.
*   **Hindi & English**: Optimized for Devanagari script and English text.
*   **History**: Auto-saves processed documents to Firebase for easy retrieval.

### 2. 🎙️ Offline Voice Dictation (Speech-to-Text)
*   **Zero-Internet Required**: Uses a local Python server with VOSK models.
*   **Privacy-First**: Audio never leaves your local machine.
*   **Real-time Editing**: Dictate directly into the OCR result box to make corrections.

### 3. ⚖️ FIR Generator & Legal Analysis
*   **Voice-to-FIR**: Generate formal FIR complaints just by speaking details in Hindi.
*   **Templated Generation**: Auto-formats text for Lost Items, Theft, Cyber Fraud, and more.
*   **Legal Insight**: (In-Progress) Analyzes text to suggest relevant BNS (Bharatiya Nyaya Sanhita) sections.
*   **Export**: Download complaints as formatted Microsoft Word (`.docx`) or Text (`.txt`) files.

---

## 🏗️ Technical Architecture

*   **Frontend**: React 18, Vite, Tailwind CSS, Shadcn UI
*   **Backend (Speech)**: Python Flask, VOSK (Offline ASR), PyAudio
*   **Database**: Firebase Firestore & Authentication
*   **OCR Engine**: Tesseract.js (Client-Side Worker)
*   **PDF Engine**: PDF.js

*(See `Document/SYSTEM_PIPELINE.md` for a detailed technical deep dive)*

---

## 🛠️ Installation & Setup

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.9+)
*   **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/niteshislol/TextSewak-OCR.git
cd TextSewak-OCR
```

### 2. Frontend Setup (Client)
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# App runs at http://localhost:8080
```

### 3. Offline Speech Server Setup (Required for Voice Features)
The offline speech engine runs on a separate Python local server.

```bash
cd textsewak_speech/
# Install Python dependencies
pip install flask flask-cors vosk pyaudio

# Download VOSK Model
# 1. Download 'vosk-model-hi-small-0.22' (or similar Hindi model)
# 2. Extract and rename the folder to 'model' inside 'textsewak_speech/'

# Run the server
python offline_app.py
# Server runs at http://localhost:5056
```

### 4. BNS Legal Engine Setup (For Legal Analysis)
This service analyzes text to suggest relevant BNS sections.

```bash
cd "BNS Legal Engine"
# Install dependencies
pip install flask sentence-transformers scikit-learn numpy

# Run the Legal Engine Server
python app.py
# Server runs at http://localhost:5053
```

---

## 📖 Usage Guide

### OCR & Document Analysis
1.  Navigate to the **App** page (`/app`).
2.  Upload an image or document.
3.  Wait for extraction.
4.  Use the **Mic button** to dictate corrections if needed.
5.  Click **Export** to save as PDF/Word.

### Generating an FIR (Offline)
1.  Navigate to **Generate FIR** (`/generate`).
2.  Select a category (e.g., Theft, Cyber Fraud).
3.  Click the **Mic icon** next to any field.
4.  Speak in Hindi (e.g., "Mera naam Rahul hai").
5.  The system converts speech to text instantly.
6.  Click **Download Word** to get the printable complaint.

---

## 📂 Project Structure

```
TextSewak-OCR/
├── client/                 # React Frontend Code
│   ├── components/         # UI Components (OcrResult, HowToUse, etc.)
│   ├── pages/              # Main Pages (Index, Generate, etc.)
│   └── lib/                # Utilities (Firebase, utils)
├── textsewak_speech/       # Python Offline Speech Server
│   ├── offline_app.py      # Flask Server Entry
│   └── model/              # VOSK Offline Model (Download separately)
├── "BNS Legal Engine"/     # Legal Analysis Service
│   ├── app.py              # Legal Engine Server
│   ├── legal_classifier.py # Logic for Section Matching
│   ├── bns.json            # Bharatiya Nyaya Sanhita Data (English)
│   └── bns_hindi.json      # Bharatiya Nyaya Sanhita Data (Hindi)
├── Document/               # Technical Documentation
│   ├── SYSTEM_PIPELINE.md  # Architecture & Visual Prompt
│   └── PROJECT_ANALYSIS.md # Optimization Report
└── vite.config.ts          # Vite Configuration
```

## 🤝 Contributing
Contributions are welcome! Please check the `Document/` folder for the roadmap and current task lists.

## 📄 License
[MIT License](LICENSE)