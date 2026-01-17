import json
import os
import glob
from sentence_transformers import SentenceTransformer, util

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Files are now in the same directory
TEMPLATES_DIR = os.path.join(BASE_DIR, "FIR REPORTS")
BNS_FILE = os.path.join(BASE_DIR, "bns_hindi.json")
BNS_FILE_EN = os.path.join(BASE_DIR, "bns.json")
SPECIAL_ACTS_FILE = os.path.join(BASE_DIR, "special_acts_hindi.json")
SPECIAL_ACTS_FILE_EN = os.path.join(BASE_DIR, "special_acts.json")
class LegalClassifier:
    def __init__(self):
        print("Initializing LegalClassifier...")

        # 1. Try to load from bundled local path (Enforce Offline)
        model_path = os.path.join(BASE_DIR, "models", "paraphrase-multilingual-MiniLM-L12-v2")
        print(f"Loading model from: {model_path}")
        
        if os.path.exists(model_path):
            try:
                self.model = SentenceTransformer(model_path, device='cpu', local_files_only=True)
                print("✔ Model loaded (OFFLINE MODE)")
            except Exception as e:
                print(f"⚠ Error loading local model: {e}")
                raise e
        else:
            print("⚠ Model not found locally.")
            print(f"Please run 'python download_model.py' to download the model to '{model_path}'")
            # We raise error here to stop execution rather than trying to download and failing
            raise FileNotFoundError(f"Model not found at {model_path}. Please run download_model.py.")

        self.bns_data = self._load_data(BNS_FILE) # Hindi (Default)
        self.bns_data_en = self._load_data(BNS_FILE_EN) # English
        self.special_acts_data = self._load_data(SPECIAL_ACTS_FILE) # Hindi Special Acts
        self.special_acts_data_en = self._load_data(SPECIAL_ACTS_FILE_EN) # English Special Acts
        self.templates = self._load_templates()
        self.template_embeddings = self._embed_templates()
        self.bns_embeddings = None # Lazy loaded for fallback
        self.special_acts_embeddings = None # Lazy loaded for special acts search

    def _load_data(self, filepath):
        if not os.path.exists(filepath):
             # Fallback logic for path
             local_path = os.path.join(BASE_DIR, "..", os.path.basename(filepath))
             if os.path.exists(local_path):
                 with open(local_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
             return []
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _load_templates(self):
        templates = []
        # Check if dir exists, if not try relative match
        search_dir = TEMPLATES_DIR
        if not os.path.exists(search_dir):
            search_dir = os.path.join(BASE_DIR, "..", "FIR REPORTS")
            
        filepaths = glob.glob(os.path.join(search_dir, "*.txt"))
        for filepath in filepaths:
            filename = os.path.basename(filepath)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            templates.append({"filename": filename, "content": content})
        return templates

    def _embed_templates(self):
        if not self.templates:
            return None
        texts = [t['content'] for t in self.templates]
        return self.model.encode(texts, convert_to_tensor=True)

    def _get_section_details(self, section_num, lang='hi'):
        data_source = self.bns_data_en if lang == 'en' else self.bns_data
        for item in data_source:
            if item.get('Section') == section_num:
                return item
        return None

    def _fallback_search(self, input_embedding, lang='hi'):
        print(f"Fallback: Performing semantic search on BNS data ({lang})...")
        # NOTE: Search is always done on semantic meaning. 
        # But we return the result in the requested language.
        
        if self.bns_embeddings is None:
            # We build embeddings on HINDI data usually for better alignment with Hindi FIRs
            # But the model is multilingual. Let's stick to base data (Hindi) for indexing to be consistent.
            texts = [
                f"{item.get('chapter_title', '')} {item.get('section_title', '')} {item.get('section_desc', '')}"
                for item in self.bns_data
            ]
            self.bns_embeddings = self.model.encode(texts, convert_to_tensor=True)
        
        scores = util.cos_sim(input_embedding, self.bns_embeddings)[0]
        top_results = scores.topk(5)
        
        relevant_items = []
        for score, idx in zip(top_results.values, top_results.indices):
            if score > 0.3: # Minimum relevance threshold
                # Retrieve the item from the requested language dataset
                # Assuming parallel structure (index 0 in hi == index 0 in en)
                # If they are not perfectly aligned by index, we must search by Section ID.
                
                # Safer: Get Section ID from matched (Hindi) item, then find it in Target Lang
                matched_item_hi = self.bns_data[idx]
                target_item = self._get_section_details(matched_item_hi.get('Section'), lang)
                
                if target_item:
                    relevant_items.append(target_item)
                else:
                     relevant_items.append(matched_item_hi) # Fallback to Hindi if En missing
        return relevant_items

    def _get_bns_keyword_matches(self, input_text, lang='hi'):
        """Checks input text for specific keywords and returns list of corresponding section details."""
        input_lower = input_text.lower()
        matched_sections = []
        seen_section_ids = set()
        matched_messages = []
        
        # Define rules: (keyword_list, section_nums, custom_msg)
        rules = [
            # Murder
            (["murder", "killed", "homicide", "assassination", "fatal attack", "murdered"], [100, 101, 102, 103], "Murder / Homicide"),
            (["हत्या", "मार डाला", "कत्ल", "मौत", "जान से मारा"], [100, 101, 102, 103], "Murder / Homicide"),
            
            # Rape / Sexual Assault
            (["rape", "sexual assault", "gang rape", "sexual violence", "forced sex"], [63, 64, 65, 66, 70], "Rape / Sexual Assault"),
            (["बलात्कार", "यौन हमला", "सामूहिक बलात्कार", "जबरदस्ती"], [63, 64, 65, 66, 70], "Rape / Sexual Assault"),
            
            # Kidnapping / Abduction
            (["kidnapping", "abduction", "kidnapped", "missing person", "abducted"], [87, 88, 89], "Kidnapping / Abduction"),
            (["अपहरण", "अगवा", "गायब"], [87, 88, 89], "Kidnapping / Abduction"),
            
            # Theft / Robbery
            (["theft", "robbery", "burglary", "stolen", "loot", "dacoity", "snatching", "pickpocket"], [305, 306, 307, 309], "Theft / Robbery"),
            (["चोरी", "लूट", "डकैती", "चोरी हुई", "छीनना", "जेबकतरा"], [305, 306, 307, 309], "Theft / Robbery"),
            
            # Fraud / Cheating
            (["fraud", "cheating", "scam", "defraud", "con", "fake", "forgery", "embezzlement"], [318, 319, 320], "Fraud / Cheating"),
            (["धोखाधड़ी", "ठगी", "फरेब", "नकली", "जालसाजी"], [318, 319, 320], "Fraud / Cheating"),
            
            # Assault / Harassment
            (["assault", "harassment", "molestation", "eve teasing", "stalking", "beating", "attack"], [74, 75, 76, 77, 78, 79], "Assault / Harassment"),
            (["हमला", "उत्पीड़न", "छेड़छाड़", "पीछा करना", "मारपीट"], [74, 75, 76, 77, 78, 79], "Assault / Harassment"),
            
            # Extortion / Blackmail
            (["extortion", "blackmail", "ransom", "threatening", "demand money"], [351, 352, 353, 354, 355, 356, 357, 358], "Extortion / Blackmail"),
            (["जबरन वसूली", "ब्लैकमेल", "फिरौती", "धمकी", "पैसे की मांग"], [351, 352, 353, 354, 355, 356, 357, 358], "Extortion / Blackmail"),
            
            # Dowry Death
            (["dowry death", "bride burning", "dowry murder"], [80], "Dowry Death"),
            (["दहेज मृत्यु", "दहेज हत्या", "दुल्हन जलाना"], [80], "Dowry Death"),
            
            # Cruelty / Domestic Violence
            (["cruelty", "torture", "domestic abuse", "wife beating", "mental torture"], [85, 86], "Cruelty / Domestic Violence"),
            (["क्रूरता", "प्रताड़ना", "घरेलू हिंसा", "पत्नी की पिटाई", "मानसिक यातना"], [85, 86], "Cruelty / Domestic Violence"),
            
            # Accident / Negligence
            (["accident", "negligence", "rash driving", "hit and run", "vehicular homicide", "car accident", "drink and drive", "drink drive", "drunk driving", "drunken driving"], [23, 24, 106], "Causing death by negligence / Intoxication"),
            (["दुर्घटना", "लापरवाही", "तेज ड्राइविंग", "हिट एंड रन", "गाड़ी दुर्घटना", "शराब पीकर वाहन", "शराब पीकर ड्राइविंग", "नशे में गाड़ी"], [23, 24, 106], "Causing death by negligence / Intoxication"),
            
            # Hurt / Grievous Hurt
            (["hurt", "injury", "grievous hurt", "wounded", "beaten", "physical assault"], [115, 117, 118, 124, 125, 126, 127], "Hurt / Grievous Hurt"),
            (["चोट", "गंभीर चोट", "घायल", "मारपीट", "शारीरिक हमला"], [115, 117, 118, 124, 125, 126, 127], "Hurt / Grievous Hurt"),
            
            # Attempt to Murder
            (["attempt to murder", "tried to kill", "murder attempt", "attack with intent"], [109], "Attempt to Murder"),
            (["हत्या का प्रयास", "मारने की कोशिश", "जान से मारने की कोशिश"], [109], "Attempt to Murder"),
            
            # Defamation
            (["defamation", "slander", "libel", "false accusation", "reputation damage"], [356], "Defamation"),
            (["मानहानि", "झूठा आरोप", "बदनामी", "इज्जत खराब"], [356], "Defamation"),
            
            # Trespass
            (["trespass", "illegal entry", "breaking in", "house breaking"], [303, 304], "Trespass / House Breaking"),
            (["अतिक्रमण", "अवैध प्रवेश", "घर में घुसना"], [303, 304], "Trespass / House Breaking"),
            
            # Abetment of Suicide
            (["suicide", "abetment of suicide", "drove to suicide"], [107, 108], "Abetment of Suicide"),
            (["आत्महत्या", "आत्महत्या के लिए उकसाना", "आत्महत्या के लिए मजबूर"], [107, 108], "Abetment of Suicide"),
            
            # Sedition / Acts Endangering Sovereignty (BNS 152)
            (["sedition", "treason", "anti-national", "sovereignty"], [152], "Acts endangering sovereignty, unity and integrity of India"),
            (["राष्ट्रद्रोह", "देशद्रोह", "गद्दारी", "राष्ट्रद्रोद"], [152], "Acts endangering sovereignty, unity and integrity of India"),

            # Riot / Mob Violence
            (["riot", "mob violence", "unlawful assembly", "public disorder", "lynching"], [189, 190, 191], "Riot / Unlawful Assembly"),
            (["दंगा", "भीड़ हिंसा", "अवैध जमावड़ा", "भीड़ द्वारा हत्या"], [189, 190, 191], "Riot / Unlawful Assembly"),
        ]

        # Add backward compatible rules
        rules.extend([
            (["नौकर कर्मचारी द्वार चोरी", "naukar karmchari dwara chori"], [306], "Theft by clerk or servant."),
            (["घर में चोरी", "ghar me chori"], [305], "Theft in dwelling house, etc."),
            (["रास्ते में चीज मिली और उसने लौटा दी नहीं", "raste me chij mili aur usne lauta di nahi"], [314], "Dishonest misappropriation of property."),
            (["दुर्घटना सामने वाले की वजह से हुई और मौत हो गई", "durghatna samne wale ki wajah se hui aur maut ho gai"], [106], "Causing death by negligence."),
            (["दुर्घटना में चोट लगी", "durghatna me chot lagi"], [115, 117], "Voluntarily causing hurt / Grievous hurt."),
            (["सिर्फ जान को खतरा था", "sirf jaan ko khatra tha"], [125], "Act endangering life or personal safety of others."),
        ])

        for keywords, sections, msg in rules:
            for keyword in keywords:
                if keyword in input_lower:
                    # Found a match, add sections if not already added
                    matched_messages.append(msg)
                    for sec_id in sections:
                        if sec_id not in seen_section_ids:
                            details = self._get_section_details(sec_id, lang)
                            if details:
                                matched_sections.append(details)
                                seen_section_ids.add(sec_id)
                    # We match all keywords, so we don't break here to allow multi-label
                    # But we break the INNER loop (keywords) to avoid processing same rule multiple times for same input
                    break
        
        return matched_sections, list(set(matched_messages))

    def _get_sections_by_ids(self, section_nums, lang='hi'):
        """Helper to fetch details for a list of section numbers."""
        results = []
        for sec_num in section_nums:
            details = self._get_section_details(sec_num, lang)
            if details:
                results.append(details)
            else:
                results.append({
                    "Section": sec_num,
                    "section_title": "Details not found in database",
                    "section_desc": "",
                    "chapter": "?",
                    "chapter_title": "?"
                })
        return results

    def _get_special_acts_matches(self, input_text, lang='hi'):
        """Checks input text for special acts keywords and returns list of corresponding acts."""
        input_lower = input_text.lower()
        matched_acts = []
        seen_act_ids = set()
        matched_messages = []
        
        # Define special acts keyword rules: (keywords_list, act_identifier, lang_filter)
        special_acts_rules = [
            # IT Act, 2000
            (["hack", "hacking", "cyber", "cybercrime", "online fraud", "data theft", "phishing", "identity theft", "computer crime"], "IT Act, 2000", "en"),
            (["हैकिंग", "साइबर", "साइबर अपराध", "ऑनलाइन धोखाधड़ी", "डेटा चोरी", "कंप्यूटर अपराध"], "IT Act, 2000", "hi"),
            
            # NDPS Act, 1985
            (["drugs", "drug", "narcotics", "heroin", "cocaine", "ganja", "charas", "opium", "drug trafficking", "drug possession"], "NDPS Act, 1985", "en"),
            (["ड्रग्स", "नशीले पदार्थ", "हेरोइन", "कोकीन", "गांजा", "चरस", "अफीम", "नशा"], "NDPS Act, 1985", "hi"),
            
            # POCSO Act, 2012
            (["child abuse", "child sexual", "minor sexual", "child pornography", "pedophile", "child harassment"], "POCSO Act, 2012", "en"),
            (["बच्चे के साथ यौन", "नाबालिग यौन", "बाल यौन शोषण", "बच्चे के साथ उत्पीड़न"], "POCSO Act, 2012", "hi"),
            
            # Prevention of Corruption Act, 1988
            (["bribe", "bribery", "corruption", "corrupt official", "kickback"], "Prevention of Corruption Act, 1988", "en"),
            (["रिश्वत", "भ्रष्टाचार", "घूस"], "Prevention of Corruption Act, 1988", "hi"),
            
            # Dowry Prohibition Act, 1961
            (["dowry", "dowry death", "dowry harassment", "dowry demand"], "Dowry Prohibition Act, 1961", "en"),
            (["दहेज", "दहेज हत्या", "दहेज प्रताड़ना"], "Dowry Prohibition Act, 1961", "hi"),
            
            # Wildlife Protection Act, 1972
            (["wildlife", "poaching", "hunting", "endangered species", "illegal hunting"], "Wildlife Protection Act, 1972", "en"),
            (["वन्यजीव", "शिकार", "अवैध शिकार"], "Wildlife Protection Act, 1972", "hi"),
            
            # PCMA, 2006
            (["child marriage", "underage marriage", "minor marriage"], "PCMA, 2006", "en"),
            (["बाल विवाह", "नाबालिग विवाह"], "PCMA, 2006", "hi"),
            
            # UAPA, 1967
            (["terrorism", "terrorist", "terror attack", "unlawful activity"], "UAPA, 1967", "en"),
            (["आतंकवाद", "आतंकवादी", "आतंकी हमला"], "UAPA, 1967", "hi"),
            
            # Domestic Violence Act, 2005
            (["domestic violence", "marital abuse", "wife beating", "physical abuse wife"], "Domestic Violence Act, 2005", "en"),
            (["घरेलू हिंसा", "पत्नी प्रताड़ना", "पत्नी की पिटाई"], "Domestic Violence Act, 2005", "hi"),
            
            # SC/ST Act, 1989
            (["caste discrimination", "atrocity", "untouchability", "caste abuse", "dalit harassment", "st st jati wad", "scheduled caste", "scheduled tribe"], "SC/ST Act, 1989", "en"),
            (["जातिगत भेदभाव", "अत्याचार", "अस्पृश्यता", "अनुसूचित जनजाति", "अनुसूचित जाति", "जाति वाद", "जातिवाद", "छुआछूत", "शिड्युल्ड कास्ट", "शिद्युल्ड ट्राईब", "एट्रोसीटीझ", "दलित"], "SC/ST Act, 1989", "hi"),
            
            # IT Act (Added Social Media context for Jatiwad FIR)
            (["facebook", "social media", "whatsapp", "website", "posted online"], "IT Act, 2000", "en"),
            (["फेसबुक", "सोशल मीडिया", "व्हाट्सएप", "वेबसाइट", "ऑनलाइन पोस्ट"], "IT Act, 2000", "hi"),
        ]
        
        for keywords, act_id, rule_lang in special_acts_rules:
            for keyword in keywords:
                if keyword in input_lower:
                    if act_id not in seen_act_ids:
                        # Find the act in the appropriate data source
                        data_source = self.special_acts_data_en if lang == 'en' else self.special_acts_data
                        matching_act = None
                        for act in data_source:
                            if act.get('Section') == act_id:
                                matching_act = act
                                break
                        
                        if matching_act:
                            matched_acts.append({
                                "chapter": matching_act.get('chapter', 0),
                                "chapter_title": matching_act.get('chapter_title', ''),
                                "Section": matching_act.get('Section', ''),
                                "section_title": matching_act.get('section_title', ''),
                                "section_desc": matching_act.get('section_desc', ''),
                                "confidence": 1.0
                            })
                            seen_act_ids.add(act_id)
                            matched_messages.append(f"Special Act Found: {act_id}")
                    break # Break keyword loop, move to next rule
        
        return matched_acts, matched_messages

    def _search_special_acts(self, input_embedding, lang='hi'):
        """Search for relevant special acts based on input text."""
        print(f"Searching special acts ({lang})...")
        
        # Build embeddings if not already done
        if self.special_acts_embeddings is None:
            # Use Hindi data for indexing (multilingual model handles both)
            texts = [act.get('section_desc', '') for act in self.special_acts_data]
            self.special_acts_embeddings = self.model.encode(texts, convert_to_tensor=True)
        
        # Perform similarity search
        scores = util.cos_sim(input_embedding, self.special_acts_embeddings)[0]
        top_results = scores.topk(3)  # Get top 3 matches
        
        relevant_acts = []
        data_source = self.special_acts_data_en if lang == 'en' else self.special_acts_data
        
        for score, idx in zip(top_results.values, top_results.indices):
            if score > 0.4:  # Threshold for special acts
                act = data_source[idx]
                relevant_acts.append({
                    'chapter': act.get('chapter', 0),
                    'chapter_title': act.get('chapter_title', ''),
                    'Section': act.get('Section', ''),
                    'section_title': act.get('section_title', ''),
                    'section_desc': act.get('section_desc', ''),
                    'confidence': float(score)
                })
        
        return relevant_acts


    def classify(self, input_fir, lang='hi'):
        if not self.templates:
            return {"error": "No templates found"}

        result = {
            "matched_template": "Keyword/Semantic Analysis",
            "confidence_score": 0.0,
            "relevant_sections": [],
            "special_acts": [],
            "custom_message": "",
            "is_fallback": False
        }
        
        # 1. Check all keyword rules (BNS and Special Acts)
        special_acts, special_msgs = self._get_special_acts_matches(input_fir, lang)
        if special_acts:
            result['special_acts'].extend(special_acts)
            result['custom_message'] += "; ".join(special_msgs)
            result['confidence_score'] = 1.0

        bns_sections, bns_msgs = self._get_bns_keyword_matches(input_fir, lang)
        if bns_sections:
            result['relevant_sections'].extend(bns_sections)
            if result['custom_message']: 
                result['custom_message'] += " | " 
            result['custom_message'] += "; ".join(bns_msgs)
            result['confidence_score'] = 1.0

        # If we found any keyword matches, we can optionally perform deeper semantic search 
        # or just return. For now, if we match keywords, we assume high confidence and return.
        # However, user requested "multiple keywords" which we handled.
        
        if result['special_acts'] or result['relevant_sections']:
             return result

        # 2. Template Matching (Fallback if no keywords)
        input_embedding = self.model.encode(input_fir, convert_to_tensor=True)
        scores = util.cos_sim(input_embedding, self.template_embeddings)[0]
        
        best_score_idx = scores.argmax().item()
        best_match_file = self.templates[best_score_idx]['filename']
        best_score = scores[best_score_idx].item()
        
        result = {
            "matched_template": best_match_file,
            "confidence_score": float(best_score),
            "relevant_sections": [],
            "custom_message": "",
            "is_fallback": False,
            "special_acts": []  # Initialize special acts field
        }

        # Search for special acts
        special_acts = self._search_special_acts(input_embedding, lang)
        result['special_acts'] = special_acts

        # Threshold check for fallback
        if best_score < 0.6:
            result["is_fallback"] = True
            result["matched_template"] = "Manual Analysis (Fallback)"
            
            fallback_items = self._fallback_search(input_embedding, lang)
            if not fallback_items:
                 result["custom_message"] = "No specific legal procedure found for this case."
            else:
                 result["relevant_sections"] = fallback_items
            return result

        # Rule Logic
        section_nums = []
        
        if best_match_file == "Saman Lost FIR .txt":
            result["custom_message"] = "FIR Should be written.\\nNote: misused, this section will be applied under Bhartiya Nyaya Sanhita."
            section_nums = [314]
            
        elif best_match_file in ["Normal No FIR .txt", "Holi Nibandh .txt", "No FIR Normal .txt"]:
            result["custom_message"] = "No Legal Things should be done for it."
            return result # Return early, no sections

        elif best_match_file == "Fight Ladai Jhagda FIR.txt":
            section_nums = [125, 130, 131]
            
        elif best_match_file == "Thief Report FIR.txt":
            section_nums = [305, 307, 309, 353, 356]
            
        elif best_match_file == "FIR.txt":
            section_nums = [152, 197, 196]
            
        else:
             # Default fallback if file matched but no rule?
             result["is_fallback"] = True
             result["matched_template"] = f"{best_match_file} (No Logic Defined)"
             fallback_items = self._fallback_search(input_embedding, lang)
             result["relevant_sections"] = fallback_items
             return result

        # Populate section details
        result["relevant_sections"] = self._get_sections_by_ids(section_nums, lang)
        
        return result


# Singleton instance for easy import
# classifier = LegalClassifier() # Don't instantiate on import to avoid overhead if not needed immediately
