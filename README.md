# 🎙️ Icebreaker

**Icebreaker** is a real-time multimodal conversation practice tool for people with social anxiety. Built for the **Gemini Live Agent Challenge**, it provides a safe space to practice networking conversations with an AI persona before real events.

---

## 🚀 Quick Start

### 1. Backend (FastAPI + ADK)
Requires Python 3.10+
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # Fill in your GCP variables

uvicorn main:app --reload
```

### 2. Frontend (React + Vite)
Requires Node 18+
```bash
cd frontend
npm install
npm run dev
```

---

## ✨ Features
- **Real-time Voice Intraction**: Built on Gemini Live API for low latency conversational AI.
- **Multimodal Coaching**: Captures webcam frames to analyze non-verbal cues (posture, expression).
- **Diverse Personas**: Practice different social scenarios ranging from easy small-talk to hard cold intros.

## 🛠️ Tech Stack
- Frontend: React, Tailwind CSS, Vite
- Backend: FastAPI, Google Agent Development Kit (ADK)
- Edge AI: Google Vertex AI (Gemini Live API)
- Database: Google Firestore
- Deployment: Google Cloud Run
