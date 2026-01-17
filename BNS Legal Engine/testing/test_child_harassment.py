from legal_classifier import LegalClassifier

print("Testing Special Acts Display")
print("="*50)

lc = LegalClassifier()

# Test case: child harassment should trigger POCSO Act
test_input = "child harassment"
print(f"\nInput: '{test_input}'")

result = lc.classify(test_input, lang='en')

print(f"\nMatched Template: {result.get('matched_template')}")
print(f"Confidence: {result.get('confidence_score')}")

if result.get('special_acts'):
    print(f"\nSpecial Acts Found: {len(result['special_acts'])}")
    for act in result['special_acts']:
        print(f"\n  Act: {act.get('Section')}")
        print(f"  Title: {act.get('section_title')}")
        print(f"  Chapter: {act.get('chapter')} - {act.get('chapter_title')}")
else:
    print("\nNo special acts found!")

if result.get('relevant_sections'):
    print(f"\nBNS Sections Found: {len(result['relevant_sections'])}")
    for sec in result['relevant_sections']:
        print(f"  Section {sec.get('Section')}: {sec.get('section_title')}")

print("\n" + "="*50)
print("Result structure:")
import json
print(json.dumps(result, indent=2, ensure_ascii=False))
