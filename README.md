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

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable               | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT` | Your GCP project ID                                                    |
| `GOOGLE_CLOUD_REGION`  | Region (e.g. `us-central1`)                                            |
| `VERTEX_AI_LOCATION`   | Vertex AI region (e.g. `us-central1`)                                  |
| `GEMINI_MODEL`         | Gemini model ID (e.g. `gemini-2.5-flash-native-audio-preview-12-2025`) |
| `ENVIRONMENT`          | `development` or `production`                                          |
| `ALLOWED_ORIGINS`      | CORS origin for frontend (e.g. `http://localhost:5173`)                |

Authentication uses **Application Default Credentials** — run `gcloud auth application-default login` locally, or rely on the attached service account on Cloud Run. No key file needed.

### Frontend (`frontend/.env.local`)

Create `frontend/.env.local` with:

```bash
VITE_API_URL=http://localhost:8080        # backend URL
VITE_GEMINI_API_KEY=your-gemini-api-key  # from Google AI Studio
```

> `VITE_GEMINI_API_KEY` is used for direct Gemini calls from the browser. Get a key at [aistudio.google.com](https://aistudio.google.com). Never commit this file.

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
