from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import urllib.parse

app = Flask(__name__)
CORS(app)

# Load models
model = joblib.load("models/naive_bayes_model.joblib")
all_symptoms = joblib.load("models/symptom_list.joblib")

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

SEVERE_DISEASES = {
    "hiv infections", "kidney disease", "decubitus ulcer",
    "sepsis (invertebrate)", "carcinoma", "lymphoma", "leukemia"
}

# Improved: more phrases + case-insensitive partial match
RED_FLAG_PHRASES = [
    "blood in cough", "coughing blood", "blood in sputum",
    "vomiting blood", "blood in stool", "black stool",
    "severe chest pain", "difficulty breathing", "fainting",
    "loss of consciousness", "severe abdominal pain",
    "blood in mouth", "blood from mouth", "bleeding from mouth"  # ← added
]

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

def symptoms_to_vector(symptoms):
    return np.array([1 if s in symptoms else 0 for s in all_symptoms]).reshape(1, -1)

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

def google_search_link(text):
    query = text + " causes symptoms"
    return "https://www.google.com/search?q=" + urllib.parse.quote(query)

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json
    text = data.get('symptoms', '').strip()
    text_lower = text.lower()

    if not text:
        return jsonify({"message": "No symptoms provided"}), 400

    # ─── RED FLAG CHECK (improved partial matching) ───
    for phrase in RED_FLAG_PHRASES:
        if phrase in text_lower:
            return jsonify({
                "severity": "high",
                "message": "⚠️ This symptom may indicate a potentially serious condition. Please seek immediate medical attention or consult a healthcare professional. Note: This is not a medical diagnosis.",
                "recommendations": [
                    "Seek immediate medical attention or consult a healthcare professional.",
                    "You may also review reliable information here: " + google_search_link(text)
                ]
            })

    symptoms = extract_symptoms(text_lower)

    # ─── FOOD / STOMACH + VOMIT / DIZZINESS CONTEXT (improved) ───
    food_keywords = ["ate", "outside", "outdoors", "street food", "yesterday"]
    vomit_dizzy_keywords = ["vomit", "vomiting", "dizziness", "dizzy", "nausea"]
    stomach_keywords = ["stomach", "abdominal"]

    has_food_context = any(k in text_lower for k in food_keywords)
    has_vomit_dizzy = any(k in text_lower for k in vomit_dizzy_keywords)
    has_stomach = any(k in text_lower for k in stomach_keywords)

    if (has_stomach or has_vomit_dizzy) and has_food_context:
        return jsonify({
            "severity": "medium",
            "message": "Your symptoms may be related to food-borne illness, gastritis, or something you ate. Note: This is not a medical diagnosis.",
            "recommendations": [
                "Stay hydrated, rest, and avoid solid food for now.",
                "Monitor symptoms closely — seek medical help if vomiting persists, dizziness worsens, or you develop fever / severe pain."
            ]
        })

    if not symptoms:
        return jsonify({
            "severity": "low",
            "message": "I couldn’t confidently detect specific symptoms. Note: This is not a medical diagnosis.",
            "recommendations": [
                "Try describing more details.",
                "You may find reliable information here: " + google_search_link(text)
            ]
        })

    # ─── MILD CASE HANDLING (slightly stricter) ───
    if len(symptoms) <= 2 and "blood" not in text_lower:
        return jsonify({
            "severity": "low",
            "message": "Your symptoms appear mild and commonly associated with viral or minor illnesses. Note: This is not a medical diagnosis.",
            "recommendations": [
                "Rest, hydration, and monitoring symptoms is generally advised.",
                "Consult a doctor if symptoms last more than a few days or worsen."
            ]
        })

    # ─── ML PREDICTION ───
    results = predict(symptoms)
    if not results:
        return jsonify({
            "severity": "medium",
            "message": "I need more symptom information to give meaningful suggestions. Note: This is not a medical diagnosis.",
            "recommendations": [
                "You may review trusted sources here: " + google_search_link(text)
            ]
        })

    conditions = [{"name": d, "probability": float(p)} for d, p in results]
    return jsonify({
        "severity": "medium",
        "detected_symptoms": symptoms,
        "conditions": conditions,
        "message": "These are informational suggestions based on symptom patterns, not a diagnosis. Note: This is not a medical diagnosis.",
        "recommendations": [
            "Consult a healthcare professional for proper diagnosis and treatment."
        ]
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')