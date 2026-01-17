from legal_classifier import LegalClassifier
import json

print("="*70)
print("Testing Keyword-Based Detection - Special Acts & BNS")
print("="*70)

# Initialize classifier
print("\n1. Initializing LegalClassifier...")
lc = LegalClassifier()
print(f"   Special acts loaded: {len(lc.special_acts_data)}")

# Test Special Acts Keywords
print("\n" + "="*70)
print("SPECIAL ACTS KEYWORD TESTS")
print("="*70)

special_acts_tests = [
    ("Cyber Crime", "Someone hacked my email", "en"),
    ("Cyber Crime Hindi", "मेरा अकाउंट हैक हो गया", "hi"),
    ("Drugs", "Caught with heroin", "en"),
    ("Drugs Hindi", "नशीले पदार्थ बेच रहा था", "hi"),
    ("Child Abuse", "Child sexual abuse case", "en"),
    ("Corruption", "Government official taking bribe", "en"),
    ("Corruption Hindi", "रिश्वत ली गई", "hi"),
    ("Dowry", "Dowry harassment", "en"),
    ("Wildlife", "Illegal hunting of animals", "en"),
]

for i, (test_name, input_text, lang) in enumerate(special_acts_tests, 1):
    print(f"\n{i}. {test_name}")
    print(f"   Input: '{input_text}'")
    
    result = lc.classify(input_text, lang=lang)
    
    if result.get('special_acts'):
        for act in result['special_acts']:
            print(f"   MATCHED: {act.get('Section')} - {act.get('section_title')}")
            print(f"   Confidence: {act.get('confidence', 0):.2f}")
    else:
        print(f"   No special acts matched")

# Test BNS Keywords
print("\n" + "="*70)
print("BNS KEYWORD TESTS")
print("="*70)

bns_tests = [
    ("Murder", "He murdered someone", "en"),
    ("Murder Hindi", "हत्या हो गई", "hi"),
    ("Rape", "Rape case", "en"),
    ("Kidnapping", "Child kidnapped", "en"),
    ("Theft", "Robbery at home", "en"),
    ("Fraud", "Online scam and fraud", "en"),
    ("Accident", "Hit and run accident", "en"),
    ("Assault", "Physical assault and beating", "en"),
]

for i, (test_name, input_text, lang) in enumerate(bns_tests, 1):
    print(f"\n{i}. {test_name}")
    print(f"   Input: '{input_text}'")
    
    result = lc.classify(input_text, lang=lang)
    
    if result.get('relevant_sections'):
        print(f"   MATCHED: {result.get('matched_template')}")
        print(f"   Sections: {[s.get('Section') for s in result['relevant_sections']]}")
    else:
        print(f"   No BNS sections matched")

print("\n" + "="*70)
print("Testing Complete!")
print("="*70)

# Save results
print("\nSaving test results to keyword_test_results.json...")
all_results = {
    "special_acts_tests": [],
    "bns_tests": []
}

for test_name, input_text, lang in special_acts_tests:
    result = lc.classify(input_text, lang=lang)
    all_results["special_acts_tests"].append({
        "test_name": test_name,
        "input": input_text,
        "language": lang,
        "matched": bool(result.get('special_acts')),
        "result": result
    })

for test_name, input_text, lang in bns_tests:
    result = lc.classify(input_text, lang=lang)
    all_results["bns_tests"].append({
        "test_name": test_name,
        "input": input_text,
        "language": lang,
        "matched": bool(result.get('relevant_sections')),
        "result": result
    })

with open('keyword_test_results.json', 'w', encoding='utf-8') as f:
    json.dump(all_results, f, indent=2, ensure_ascii=False)

print("Results saved successfully!")
