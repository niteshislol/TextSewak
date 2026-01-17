from legal_classifier import LegalClassifier

print("="*60)
print("Testing Special Acts Integration")
print("="*60)

# Initialize classifier
print("\n1. Initializing LegalClassifier...")
lc = LegalClassifier()
print(f"   Special acts loaded: {len(lc.special_acts_data)}")
print(f"   Special acts (EN) loaded: {len(lc.special_acts_data_en)}")


# Test 1: Cyber Crime (IT Act)
print("\n2. Testing Cyber Crime Detection (IT Act)...")
result = lc.classify('Someone hacked my email account and stole my personal data', lang='en')
special_acts = result.get('special_acts', [])
print(f"   Input: 'Someone hacked my email account and stole my personal data'")
print(f"   Special Acts Found: {len(special_acts)}")
for act in special_acts:
    print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")

# Test 2: Child Protection (POCSO Act) - Hindi
print("\n3. Testing Child Protection (POCSO Act) - Hindi...")
result = lc.classify('बच्चे के साथ यौन उत्पीड़न हुआ है', lang='hi')
special_acts = result.get('special_acts', [])
print(f"   Input: 'बच्चे के साथ यौन उत्पीड़न हुआ है'")
print(f"   Special Acts Found: {len(special_acts)}")
for act in special_acts:
    print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")

# Test 3: Drug-Related Crime (NDPS Act)
print("\n4. Testing Drug Crime (NDPS Act)...")
result = lc.classify('Caught selling drugs like heroin and cocaine', lang='en')
special_acts = result.get('special_acts', [])
print(f"   Input: 'Caught selling drugs like heroin and cocaine'")
print(f"   Special Acts Found: {len(special_acts)}")
for act in special_acts:
    print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")

# Test 4: Dowry Case
print("\n5. Testing Dowry Case...")
result = lc.classify('दहेज के लिए प्रताड़ित किया जा रहा है', lang='hi')
special_acts = result.get('special_acts', [])
print(f"   Input: 'दहेज के लिए प्रताड़ित किया जा रहा है'")
print(f"   Special Acts Found: {len(special_acts)}")
for act in special_acts:
    print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")

# Test 5: Wildlife Crime
print("\n6. Testing Wildlife Crime...")
result = lc.classify('Illegal hunting of endangered animals', lang='en')
special_acts = result.get('special_acts', [])
print(f"   Input: 'Illegal hunting of endangered animals'")
print(f"   Special Acts Found: {len(special_acts)}")
for act in special_acts:
    print(f"   - {act['act_name']} (confidence: {act['confidence']:.2f})")

print("\n" + "="*60)
print("Testing Complete!")
print("="*60)
