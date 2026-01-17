from legal_classifier import LegalClassifier

print("Testing Updated Drink and Drive Keywords")
print("="*50)

lc = LegalClassifier()

test_input = "drink and drive"
print(f"\nInput: '{test_input}'")

result = lc.classify(test_input, lang='en')

print(f"\nMatched: {result.get('matched_template')}")
print(f"Confidence: {result.get('confidence_score')}")

if result.get('relevant_sections'):
    print(f"\nBNS Sections Found: {len(result['relevant_sections'])}")
    for sec in result['relevant_sections']:
        print(f"\n  Section {sec.get('Section')}: {sec.get('section_title')}")
        print(f"  Description: {sec.get('section_desc')}")

print("\n" + "="*50)
