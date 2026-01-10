import json
import os
import glob
from sentence_transformers import SentenceTransformer, util

# --- CONFIGURATION ---
# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Files are now in the same directory
TEMPLATES_DIR = os.path.join(BASE_DIR, "FIR REPORTS")
BNS_FILE = os.path.join(BASE_DIR, "bns_hindi.json")
BNS_FILE_EN = os.path.join(BASE_DIR, "bns.json")
EMBEDDING_MODEL = 'paraphrase-multilingual-MiniLM-L12-v2'

class LegalClassifier:
    def __init__(self):
        print("Initializing LegalClassifier...")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.bns_data = self._load_data(BNS_FILE) # Hindi (Default)
        self.bns_data_en = self._load_data(BNS_FILE_EN) # English
        self.templates = self._load_templates()
        self.template_embeddings = self._embed_templates()
        self.bns_embeddings = None # Lazy loaded for fallback

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

    def _check_keyword_rules(self, input_text, lang='hi'):
        """Checks input text for specific keywords and returns corresponding sections."""
        input_lower = input_text.lower()
        
        # Define rules: (keyword_list, section_nums, custom_msg)
        rules = [
            (["नौकर कर्मचारी द्वार चोरी", "naukar karmchari dwara chori"], [306], "Theft by clerk or servant of property in possession of master."),
            (["घर में चोरी", "ghar me chori"], [305], "Theft in dwelling house, etc."),
            (["रास्ते में चीज मिली और उसने लौटा दी नहीं", "raste me chij mili aur usne lauta di nahi"], [314], "Dishonest misappropriation of property."),
            (["दुर्घटना सामने वाले की वजह से हुई और मौत हो गई", "durghatna samne wale ki wajah se hui aur maut ho gai"], [106], "Causing death by negligence."),
            (["दुर्घटना में चोट लगी", "durghatna me chot lagi"], [115, 117], "Voluntarily causing hurt / Grievous hurt."),
            (["सिर्फ जान को खतरा था", "sirf jaan ko khatra tha"], [125], "Act endangering life or personal safety of others."),
            (["चोरी", "chori", "theft"], [314, 309, 307], "Theft / Robbery (General Rule)."),
        ]

        for keywords, sections, msg in rules:
            for keyword in keywords:
                if keyword in input_lower:
                    return {
                        "matched_template": f"Keyword Match: '{keyword}'",
                        "confidence_score": 1.0,
                        "relevant_sections": self._get_sections_by_ids(sections, lang),
                        "custom_message": msg,
                        "is_fallback": False
                    }
        return None

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

    def classify(self, input_fir, lang='hi'):
        if not self.templates:
            return {"error": "No templates found"}

        # 1. Check Keyword Rules FIRST
        keyword_result = self._check_keyword_rules(input_fir, lang)
        if keyword_result:
            return keyword_result

        # 2. Template Matching
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
            "is_fallback": False
        }

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
            result["custom_message"] = "FIR Should be written.\nNote: misused, this section will be applied under Bhartiya Nyaya Sanhita."
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
