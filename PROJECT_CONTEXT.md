# 🎙️ Icebreaker — Project Context
> Last updated: March 2026

---

## 👤 Background

The builder of this project has social anxiety and struggles with networking at professional events. The core insight is that the problem isn't the event itself — it's the lack of a safe, judgment-free space to practice beforehand. Every real conversation feels like the first one because there are never any reps.

This project was built to solve that personally, and submitted to the **Gemini Live Agent Challenge** hackathon hosted on Devpost.

---

## 🏆 Hackathon

**Name:** Gemini Live Agent Challenge
**Platform:** Devpost — [geminiliveagentchallenge.devpost.com](https://geminiliveagentchallenge.devpost.com)
**Deadline:** March 16, 2026 @ 5:00pm PDT
**Category:** Live Agents 🗣️ (Real-time Interaction — Audio/Vision)
**Target Prize:** Best of Live Agents ($10,000) + Grand Prize shot ($25,000)
**Hashtag:** #GeminiLiveAgentChallenge

### Mandatory Requirements
- Gemini Live API or ADK
- Hosted on Google Cloud
- Uses Google GenAI SDK or ADK
- At least one Google Cloud service

### Judging Criteria
| Criterion | Weight |
|---|---|
| Innovation & Multimodal UX | 40% |
| Technical Implementation & Agent Architecture | 30% |
| Demo & Presentation | 30% |

### Submission Checklist
- [ ] Text description of project
- [ ] Public GitHub repository with README + spin-up instructions
- [ ] Proof of Google Cloud deployment (screen recording or code link)
- [ ] Architecture diagram
- [ ] Demo video (<4 minutes, no mockups, real working software)

### Bonus Points
- [ ] Publish blog/podcast/video about how it was built (include #GeminiLiveAgentChallenge)
- [ ] Automated Cloud deployment via scripts or IaC in the repo
- [ ] Sign up for Google Developer Group (GDG) and include public profile link

---

## 💡 What It Does

**Icebreaker** is a real-time multimodal conversation practice tool for people with social anxiety. Instead of assisting users during a live networking event (which feels dishonest and creates dependency), it gives users a safe space to practice beforehand with an AI conversation partner.

The AI plays a realistic persona — e.g. "Alex, a product manager at a fintech startup" — and holds a natural networking conversation with the user. While this happens, Gemini processes both the user's **audio** and **webcam feed** simultaneously to coach on verbal AND non-verbal signals.

After the session, the user gets a detailed debrief with scores, charts, and specific improvement actions. Progress is tracked across sessions so improvement is measurable over time.

> **Core philosophy:** The goal isn't to assist you at an event. It's to make you so practiced that you don't need assistance at all.

---

## 🎯 Why Practice Mode (Not Event Mode)

An earlier version of this concept considered an in-event earpiece assistant. This was rejected for several reasons:

- Socially risky if the other person notices
- Creates dependency rather than building real skill
- Latency requirements are near-impossible for truly useful real-time tips
- Ethically murky — feels dishonest in genuine human interactions

Practice mode is the stronger product: it builds internalized skills, is safe to demo live, and tells a compelling "before and after" story for judges.

---

## 🔄 How It Works

1. User selects a practice scenario (e.g. "Tech Networking Mixer")
2. ADK Agent initializes an AI persona with a backstory
3. User speaks via mic; webcam captures frames at ~1fps
4. Both streams are sent to Vertex AI / Gemini Live API simultaneously
5. Gemini processes audio + vision together and returns:
   - AI persona's spoken response (played back as audio)
   - A coaching tip (shown as text overlay on screen)
   - Metrics snapshot (saved to Firestore)
6. Session ends when user clicks "End Session"
7. Full debrief report generated from session data
8. Progress dashboard updated

---

## 🎭 Practice Scenarios

| Scenario | AI Persona | Difficulty |
|---|---|---|
| Small Talk Warm-Up | Friendly stranger waiting for a talk | 🟢 Beginner |
| Tech Networking Mixer | Software engineer at a startup | 🟢 Beginner |
| Reconnecting with a Weak Tie | Old acquaintance, vague memory of you | 🟡 Medium |
| Industry Conference | Senior consultant, slightly formal | 🟡 Medium |
| Cold Intro at a Booth | Busy founder, distracted | 🔴 Hard |

---

## 📊 Metrics Tracked

### Audio Signals
- Talk time ratio (user vs AI) — ideal is 40–55%
- Questions asked (count + open vs closed)
- Filler words ("um", "uh", "like", "you know")
- Sentiment arc (warming / neutral / cooling)
- Anxiety speech patterns (pace spikes, trailing sentences)

### Vision Signals (Webcam via Gemini)
- Posture confidence score (0–1)
- Facial expression warmth (0–1)
- Eye engagement proxy (face direction)
- Tension / stress cues
- Nodding / engagement signals

### Composite Score (0–100)
```
├── Talk Ratio         (20pts) — 40–55% = full score
├── Questions Asked    (20pts) — 1 open question per 2 min = ideal
├── Filler Words       (15pts) — <5% of total words = full score
├── Posture Confidence (15pts) — avg score > 0.7 = full score
├── Sentiment Trend    (15pts) — warming arc = full score
└── Recovery Moments   (15pts) — handled silences gracefully
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind (scaffolded via Bolt.new) |
| Backend | FastAPI on Google Cloud Run |
| Agent Framework | Google ADK (Agent Development Kit) |
| AI Core | Vertex AI — Gemini Live API (audio + vision) |
| Real-time Comms | WebSockets |
| Audio Capture | Web Audio API |
| Video Capture | WebRTC / Canvas frame extraction (~1fps) |
| Database | Google Firestore |
| Deployment | Google Cloud Run (containerized) |

---

## ☁️ Google Cloud Services Used

| Service | Purpose |
|---|---|
| **Cloud Run** | Hosts the FastAPI backend container |
| **Vertex AI** | Gemini Live API calls (audio + vision) |
| **Firestore** | Stores session metrics and progress history |

---

## 🗂️ Repository Structure (Planned)

```
icebreaker/
├── frontend/               # React + Tailwind web app
│   ├── src/
│   │   ├── components/     # ScenarioSelect, SessionScreen, Debrief, Progress
│   │   ├── hooks/          # useAudio, useWebcam, useWebSocket
│   │   └── App.jsx
│   └── package.json
│
├── backend/                # FastAPI + ADK
│   ├── main.py             # FastAPI entry point + WebSocket handler
│   ├── agent.py            # ADK Agent definition (SocialCoach)
│   ├── coaching.py         # Coaching engine + metric analysis
│   ├── scenarios.py        # Persona configs for each scenario
│   ├── firestore.py        # Firestore read/write helpers
│   ├── Dockerfile
│   └── requirements.txt
│
├── deploy/                 # IaC / deployment scripts (bonus points)
│   ├── deploy.sh           # gcloud run deploy script
│   └── cloudbuild.yaml     # Cloud Build config (optional)
│
├── .env.example            # Template for environment variables
├── .gitignore
├── README.md               # Spin-up instructions for judges
└── PROJECT_CONTEXT.md      # This file
```

---

## 🔐 Environment Variables

```bash
# .env (never commit this)
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_REGION=us-central1
VERTEX_AI_LOCATION=us-central1
FIRESTORE_COLLECTION=sessions
```

Authentication on Cloud Run uses **Application Default Credentials** — no service account key file needed.

---

## 🚀 MVP Build Priority (Hackathon Order)

1. Scenario selection screen (2 personas minimum)
2. Mic + webcam capture → WebSocket → backend
3. Gemini Live API connection via Vertex AI (audio in, audio + text out)
4. Live feedback tip overlay on screen
5. Post-session debrief screen (score + key metrics)
6. Firestore saving session data
7. Deploy to Cloud Run + record proof video
8. Progress dashboard (can use mock data if time runs out)
9. README with spin-up instructions
10. Architecture diagram for submission

---

## 🎬 Demo Video Plan

**Structure (under 4 minutes):**
- 0:00–0:30 — Personal story: "I have social anxiety. Networking events are terrifying."
- 0:30–1:00 — Show the problem: no safe space to practice, every event feels like the first time
- 1:00–2:30 — Live demo: run a full 90-second practice session on screen
- 2:30–3:15 — Show the debrief: score, metrics, coaching notes
- 3:15–3:45 — Show progress dashboard: "Session 1 vs Session 5"
- 3:45–4:00 — Close: "I used Icebreaker to practice before this presentation. It works."

---

## 💰 Credits & Cost

- **Hackathon credits:** Request via form on Devpost resources page (`forms.gle/rKNPXA1o6XADvQGb7`)
- **GCP free trial:** $300 credit for new accounts — covers Cloud Run + Firestore easily
- **Gemini API free tier:** Available via Google AI Studio for early prototyping
- **Most expensive part:** Gemini Live API (real-time audio + vision streaming) — use hackathon credits for this

---

## 📝 GitHub Details

**Repository name:** `icebreaker`
**Description:**
> 🎙️ AI-powered networking practice tool for the socially anxious. Gemini Live API + webcam vision coaching. Built for the Gemini Live Agent Challenge. #GeminiLiveAgentChallenge

**Topics/tags to add:** `gemini` `google-cloud` `adk` `vertex-ai` `social-anxiety` `networking` `real-time` `multimodal` `hackathon` `fastapi` `react`

---

*This document is the single source of truth for the Icebreaker project. Update it as decisions change.*
