## Inspiration

So the inspiration for this project came from my personal life. I am a socially anxious person and have always had difficulty interacting with new people. I recently decided to pursue a Master's degree in Ireland and attended my first tech conference and found it difficult to start conversations or confidently interact with others, despite wanting to. I just froze.
So I built IceBreaker, a tool designed to help people like me practice conversations for tech conferences, networking events, and professional interactions

## What it does

IceBreaker is an AI-powered networking practice tool. You pick a scenario like a casual warm-up conversation, a tech mixer, an industry conference, reconnecting with someone you barely remember, or a cold intro at a founder's booth and you practice out loud with a realistic AI persona in real time.

The AI persona opens the conversation naturally and responds like a real person: distracted, busy, curious, or guarded depending on the difficulty level. Your audio and optional webcam feed are analyzed live and coaching tips appear on screen during the conversation
After the session, you receive a detailed debrief: scores across six metrics (talk ratio, questions asked, filler words, posture confidence, sentiment trend, recovery moments), a breakdown of strengths and areas to focus on, and charts tracking your arc through the conversation
A progress dashboard lets you compare improvement across multiple sessions

## How I built it

- **Frontend** : React 19 + Vite + Tailwind CSS, with Recharts for debrief visualizations
- **AI** : Google Gemini 2.5 Flash Native Audio Preview via the Gemini Live API the browser opens a direct bidirectional WebSocket to Gemini, streaming 16kHz PCM audio in and 24kHz audio out, plus video frames at ~1fps for multimodal coaching.
- **Function calling**: Two Gemini tool calls drive the experience they are :
  - submit_tip(): fires after each user turn to deliver live coaching
  - submit_metrics(): fires at session end to generate the debrief scores
- **Backend**: Python + FastAPI hosted on Google Cloud Run, handling session lifecycle, transcript storage, and score persistence to Firestore .
- **Infrastructure**: Docker, Cloud Build CI/CD for backend , Vercel for frontend

## Challenges faced

- **Losing connection mid-session** would sometimes cause the model to hallucinate or restart the conversation entirely, completely breaking the immersion. So I build reconnection logic and handle dropped sessions gracefully.

- **Before we moved to tool calling**, the model would send coaching tips and metrics as plain text mixed into the conversation. It would paraphrase what the user said sometimes incorrectly and the output was inconsistent. Switching to structured tool calls (`submit_tip` and `submit_metrics`) fixed the reliability.

- **Persona tuning** took a lot of iteration. Getting the model to stop sounding like a helpful assistant and start sounding like an actual person at a conference required some prompt work. The non-deterministic nature of the model made this harder the same prompt could produce a warm, natural response one run and a stiff, over-formal one the next. It would ask more than 2 questions sometimes and properly another time.

## Accomplishments I am proud of

Getting Gemini Live working end to end was a real milestone as real-time audio conversations that actually feel like talking to a person, not a chatbot. On top of that, the feedback system delivers live coaching tips and metrics in a way that's actually useful . And managed to ship all of it .

## Lessons learned

Working with Gemini Live taught me a lot about real-time multimodal streaming and how fragile it can be. I also learned that free text generation is not reliable for structured outputs as switching to tool calling was a turning point. Prompt engineering to shape consistent model behaviour is very difficult and hard to predict edge cases. And most importantly, I learned what it actually takes to get something into production, not just a demo.

## What's next for IceBreaker

I want to expand the library of personas and scenarios so there is more variety to practice with. I also want to let users create their own scenarios like describe the event, the kind of person they expect to meet, and have IceBreaker generate a custom practice session around it.
