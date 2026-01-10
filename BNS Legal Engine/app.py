from flask import Flask, render_template, request, jsonify
import sys
import os

from legal_classifier import LegalClassifier

app = Flask(__name__)

# Initialize the engine once
print("Starting Legal Engine... please wait...")
engine = LegalClassifier()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    fir_text = data.get('fir_text', '')
    lang = data.get('language', 'hi') # Default to Hindi
    
    if not fir_text:
        return jsonify({"error": "No input text provided"}), 400

    results = engine.classify(fir_text, lang=lang)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
