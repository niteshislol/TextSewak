from legal_classifier import LegalClassifier
import json

print("="*60)
print("Testing Special Acts Integration")
print("="*60)

# Initialize classifier
print("\n1. Initializing LegalClassifier...")
lc = LegalClassifier()
print(f"   Special acts loaded: {len(lc.special_acts_data)}")
print(f"   Special acts (EN) loaded: {len(lc.special_acts_data_en)}")

# Test cases
test_cases = [
    ("Cyber Crime (IT Act)", "Someone hacked my email account and stole my personal data", "en"),
    ("Drug Crime (NDPS Act)", "Caught selling drugs like heroin and cocaine", "en"),
    ("Wildlife Crime", "Illegal hunting of endangered animals", "en"),
    ("Child Marriage", "Marriage of a 16 year old girl", "en"),
    ("Corruption", "Government official taking bribes", "en"),
]

print("\n" + "="*60)
print("Running Test Cases")
print("="*60)

for i, (test_name, input_text, lang) in enumerate(test_cases, 1):
    print(f"\n{i}. {test_name}")
    print(f"   Input: '{input_text}'")
    
    result = lc.classify(input_text, lang=lang)
    special_acts = result.get('special_acts', [])
    
    print(f"   Special Acts Found: {len(special_acts)}")
    for act in special_acts:
        print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")
    
    if not special_acts:
        print("   - No special acts matched")

print("\n" + "="*60)
print("Testing Complete!")
print("="*60)

# Save detailed results to JSON file
print("\nSaving detailed results to test_results.json...")
all_results = []
for test_name, input_text, lang in test_cases:
    result = lc.classify(input_text, lang=lang)
    all_results.append({
        "test_name": test_name,
        "input": input_text,
        "language": lang,
        "special_acts": result.get('special_acts', []),
        "bns_sections": result.get('relevant_sections', [])
    })

with open('test_results.json', 'w', encoding='utf-8') as f:
    json.dump(all_results, f, indent=2, ensure_ascii=False)

print("Results saved successfully!")
