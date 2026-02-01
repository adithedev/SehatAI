# SehatAI 🩺

SehatAI is an AI-powered health assistance system that analyzes user-described symptoms
and provides informational insights using machine learning and safety-based rules.

> ⚠️ SehatAI is NOT a medical diagnosis system.

---

## Features
- Symptom extraction with alias mapping
- ML-based disease probability estimation (Naive Bayes)
- Emergency red-flag detection
- Food-related illness handling
- Clear medical disclaimers

---

## Tech Stack
- Python
- Flask
- NumPy
- Joblib
- Machine Learning (Naive Bayes)
- HTML, CSS (Custom UI)

---

## How It Works
1. User inputs symptoms in natural language
2. Symptoms are extracted and validated
3. Safety rules check for emergency conditions
4. ML model suggests possible conditions
5. User is advised to consult a professional

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/SehatAI.git
cd SehatAI
pip install -r requirements.txt
python app.py
