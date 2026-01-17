from legal_classifier import LegalClassifier

print("Testing Child Harassment -> POCSO Act")
print("="*50)

lc = LegalClassifier()

test_input = "child harassment"
print(f"\nInput: '{test_input}'")

result = lc.classify(test_input, lang='en')

print(f"\nMatched: {result.get('matched_template')}")

if result.get('special_acts'):
    print(f"\nSpecial Acts Found: {len(result['special_acts'])}")
    for act in result['special_acts']:
        print(f"\n  Act: {act.get('Section')}")
        print(f"  Title: {act.get('section_title')}")
        print(f"  Chapter: {act.get('chapter')} - {act.get('chapter_title')}")

if result.get('relevant_sections'):
    print(f"\nBNS Sections Found: {len(result['relevant_sections'])}")
    for sec in result['relevant_sections'][:2]:
        print(f"  Section {sec.get('Section')}: {sec.get('section_title')}")

print("\n" + "="*50)
