from legal_classifier import LegalClassifier

print("Testing Drink and Drive Keywords")
print("="*50)

lc = LegalClassifier()

test_cases = [
    ("drink and drive", "en"),
    ("drink drive", "en"),
    ("drunk driving", "en"),
    ("शराब पीकर वाहन", "hi"),
    ("शराब पीकर ड्राइविंग", "hi"),
]

for input_text, lang in test_cases:
    print(f"\nInput: '{input_text}' ({lang})")
    result = lc.classify(input_text, lang=lang)
    
    print(f"Matched: {result.get('matched_template')}")
    
    if result.get('relevant_sections'):
        for sec in result['relevant_sections']:
            print(f"  BNS Section {sec.get('Section')}: {sec.get('section_title')}")
    
    if result.get('special_acts'):
        for act in result['special_acts']:
            print(f"  Special Act: {act.get('Section')}")

print("\n" + "="*50)
