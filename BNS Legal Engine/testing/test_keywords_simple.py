from legal_classifier import LegalClassifier
import json

print("="*70)
print("Keyword Detection Test - English Only")
print("="*70)

lc = LegalClassifier()
print(f"Loaded {len(lc.special_acts_data)} special acts\n")

# Test cases (English only to avoid console encoding issues)
tests = [
    # Special Acts
    ("Cyber/Hacking", "Someone hacked my email account"),
    ("Drugs", "Caught selling heroin and cocaine"),
    ("Child Abuse", "Child sexual abuse reported"),
    ("Corruption", "Government official taking bribes"),
    ("Dowry", "Dowry harassment case"),
    ("Wildlife", "Illegal hunting of endangered species"),
    ("Terrorism", "Terrorist attack planned"),
    
    # BNS Sections
    ("Murder", "He murdered the victim"),
    ("Rape", "Sexual assault and rape case"),
    ("Kidnapping", "Child was kidnapped"),
    ("Theft", "Robbery and burglary at home"),
    ("Fraud", "Online scam and fraud"),
    ("Accident", "Hit and run car accident"),
    ("Assault", "Physical assault and beating"),
    ("Extortion", "Blackmail and extortion"),
]

results_summary = []

for test_name, input_text in tests:
    result = lc.classify(input_text, lang='en')
    
    matched_type = "NONE"
    matched_info = ""
    
    if result.get('special_acts'):
        matched_type = "SPECIAL ACT"
        act = result['special_acts'][0]
        matched_info = f"{act.get('Section')}"
    elif result.get('relevant_sections'):
        matched_type = "BNS"
        sections = [str(s.get('Section')) for s in result['relevant_sections'][:3]]
        matched_info = f"Sections {', '.join(sections)}"
    
    results_summary.append({
        "test": test_name,
        "input": input_text,
        "type": matched_type,
        "matched": matched_info
    })
    
    print(f"{test_name:20} -> {matched_type:12} | {matched_info}")

# Save detailed results
with open('keyword_test_summary.json', 'w', encoding='utf-8') as f:
    json.dump(results_summary, f, indent=2, ensure_ascii=False)

print(f"\n{'='*70}")
print(f"Total Tests: {len(tests)}")
print(f"Special Acts Matched: {sum(1 for r in results_summary if r['type'] == 'SPECIAL ACT')}")
print(f"BNS Sections Matched: {sum(1 for r in results_summary if r['type'] == 'BNS')}")
print(f"{'='*70}")
print("\nResults saved to keyword_test_summary.json")
