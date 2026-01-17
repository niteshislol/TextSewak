from legal_classifier import LegalClassifier
import json
import sys

# Mock sys.argv to avoid potential issues if any
sys.argv = ['app.py']

print("Loading Classifier...")
try:
    lc = LegalClassifier()
except Exception as e:
    print(f"Error initializing: {e}")
    sys.exit(1)

def test(text, lang='hi'):
    print(f"\n--- Testing: '{text}' ({lang}) ---")
    res = lc.classify(text, lang=lang)
    
    special_acts = res.get('special_acts', [])
    relevant_sections = res.get('relevant_sections', [])
    
    print(f"Special Acts Found: {len(special_acts)}")
    for act in special_acts:
        print(f" - {act.get('Section')}: {act.get('section_title')}")
        
    print(f"BNS Sections Found: {len(relevant_sections)}")
    for sec in relevant_sections:
        print(f" - Section {sec.get('Section')}: {sec.get('section_title')}")
        
    print(f"Custom Message: {res.get('custom_message')}")

# Test 1: SC/ST Keyword (Hindi/English Mix)
test("st st jati wad", "hi")

# Test 2: SC/ST Keyword (Formal Hindi)
test("जातिगत भेदभाव", "hi")

# Test 3: Double Match (Murder + POCSO)
test("he committed murder and child sexual abuse", "en")

# Test 4: Multiple BNS (Theft + Murder)
test("theft and murder happened", "en")

# Test 6: Jatiwad FIR Content
fir_text = """
घी शिड्युल्ड कास्ट एण्ड शिद्युल्ड ट्राईब प्रीवेन्शन ऑफ एट्रोसीटीझ एक्ट, इण्डियन पीनल कोड एवं राष्ट्रद्रोद के अपराध तहत शिक्षा
अपराध होने का दिन... . ३० जुलाई, २०१६, शाम १७०७ से अविरत सोश्यल मीडीया पर
मेरी शिकायत के साथ अभियुक्त नं. १ के ऑफिशियल फ़ेसबुक पेज की कॉपी एवं अभियुक्त नं. १ की वेबसाईट की कॉपी शामिल है ।
"""
test(fir_text, "hi")
