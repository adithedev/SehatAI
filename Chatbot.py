import joblib
import numpy as np
import urllib.parse

# =========================
# Load trained artifacts
# =========================
model = joblib.load("models/naive_bayes_model.joblib")
all_symptoms = joblib.load("models/symptom_list.joblib")

# =========================
# Symptom alias mapping
# =========================
SYMPTOM_ALIASES = {
    "cold": ["cough", "nasal discharge"],
    "runny nose": ["nasal discharge"],
    "sore throat": ["throat pain"],
    "fever": ["pyrexia"],
    "high fever": ["pyrexia"],
    "headache": ["cephalalgia"],
    "body pain": ["myalgia"],
    "vomiting": ["vomiting"],
    "nausea": ["nausea"],
    "cough": ["cough"],
    "stomach ache": ["abdominal pain"],
    "stomach pain": ["abdominal pain"]
}

# =========================
# Severe disease blacklist
# =========================
SEVERE_DISEASES = {
    "hiv infections",
    "kidney disease",
    "decubitus ulcer",
    "sepsis (invertebrate)",
    "carcinoma",
    "lymphoma",
    "leukemia"
}

# =========================
# Red-flag phrases (override everything)
# =========================
RED_FLAG_PHRASES = [
    "blood in cough",
    "coughing blood",
    "blood in sputum",
    "vomiting blood",
    "blood in stool",
    "black stool",
    "severe chest pain",
    "difficulty breathing",
    "fainting",
    "loss of consciousness",
    "severe abdominal pain"
]

# =========================
# Symptom extraction
# =========================
def extract_symptoms(text):
    text = text.lower()
    found = set()

    for alias, canonicals in SYMPTOM_ALIASES.items():
        if alias in text:
            for c in canonicals:
                if c in all_symptoms:
                    found.add(c)

    for s in all_symptoms:
        if s in text:
            found.add(s)

    return list(found)

# =========================
# Vectorization
# =========================
def symptoms_to_vector(symptoms):
    return np.array(
        [1 if s in symptoms else 0 for s in all_symptoms]
    ).reshape(1, -1)

# =========================
# ML prediction (filtered)
# =========================
def predict(symptoms):
    vector = symptoms_to_vector(symptoms)

    if vector.sum() <= 1:
        return []

    probs = model.predict_proba(vector)[0]
    results = []

    for i, disease in enumerate(model.classes_):
        if disease.lower() in SEVERE_DISEASES:
            continue
        results.append((disease, probs[i]))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:3]

# =========================
# Google search fallback
# =========================
def google_search_link(text):
    query = text + " causes symptoms"
    return "https://www.google.com/search?q=" + urllib.parse.quote(query)

# =========================
# Main chatbot loop
# =========================
def main():
    print("Medical Chatbot (type 'exit' to quit)")
    print("-----------------------------------")

    while True:
        text = input("You: ").strip()
        if text.lower() == "exit":
            break

        text_lower = text.lower()

        # 🚨 RED FLAG OVERRIDE
        for phrase in RED_FLAG_PHRASES:
            if phrase in text_lower:
                print("Bot: ⚠️ This symptom may indicate a potentially serious condition.")
                print("Bot: Please seek immediate medical attention or consult a healthcare professional.")
                print("Bot: You may also review reliable information here:")
                print(google_search_link(text))
                print("Note: This is not a medical diagnosis.\n")
                break
        else:
            symptoms = extract_symptoms(text)

            # 🍔 FOOD / STOMACH CONTEXT
            if ("stomach" in text_lower or "abdominal" in text_lower) and (
                "outside" in text_lower or "street food" in text_lower or "ate" in text_lower
            ):
                print("Bot: Your symptoms may be related to food-borne illness or gastritis.")
                print("Bot: Stay hydrated and monitor symptoms. Seek care if pain, fever, or vomiting persists.")
                print("Note: This is not a medical diagnosis.\n")
                continue

            if not symptoms:
                print("Bot: I couldn’t confidently analyze your symptoms.")
                print("Bot: You may find reliable information here:")
                print(google_search_link(text))
                print("Note: This is not a medical diagnosis.\n")
                continue

            # 🟢 MILD CASE HANDLING
            if len(symptoms) <= 2 and "blood" not in text_lower:
                print("Bot: Your symptoms appear mild and commonly associated with viral or minor illnesses.")
                print("Bot: Rest, hydration, and monitoring symptoms is generally advised.")
                print("Note: This is not a medical diagnosis.\n")
                continue

            # 🧠 ML PREDICTION
            results = predict(symptoms)
            if not results:
                print("Bot: I need more symptom information to give meaningful suggestions.")
                print("Bot: You may review trusted sources here:")
                print(google_search_link(text))
                print("Note: This is not a medical diagnosis.\n")
                continue

            print("Bot: Possible conditions based on symptom similarity:")
            for d, p in results:
                print(f"- {d} ({p:.3f})")

            print("Bot: These are informational suggestions, not a diagnosis.")
            print("Note: This is not a medical diagnosis.\n")

# =========================
# Entry point
# =========================
if __name__ == "__main__":
    main()
