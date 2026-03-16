import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

export function useGeminiLive({ systemPrompt, voice = "Puck", withVideo = false, onMetrics }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [liveTip, setLiveTip] = useState(null);
  const [isDropped, setIsDropped] = useState(false);

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const micStreamRef = useRef(null);
  const micActiveRef = useRef(true);
  const isConnectingRef = useRef(false);
  const intentionalCloseRef = useRef(false);

  const videoStreamRef = useRef(null);
  const videoElRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const playbackCtxRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  const metricsTranscriptRef = useRef("");
  const textBufferRef = useRef("");
  const finalMetricsRef = useRef(null);
  const userSpokeRef = useRef(false);

  const onMetricsRef = useRef(onMetrics);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const systemPromptRef = useRef(systemPrompt);
  const voiceRef = useRef(voice);
  const withVideoRef = useRef(withVideo);

  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { withVideoRef.current = withVideo; }, [withVideo]);

  // ─────────────────────────────────────────
  // Media Setup
  // ─────────────────────────────────────────
  const canvasRef = useRef(null);

  async function startMedia() {
    // Stop any existing tracks before (re)starting — prevents stale camera on reconnect
    processorRef.current?.disconnect();
    processorRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    videoStreamRef.current = null;
    videoElRef.current?.pause();
    videoElRef.current = null;

    let stream;
    if (withVideoRef.current) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const videoStream = new MediaStream(stream.getVideoTracks());
        videoStreamRef.current = videoStream;
        const video = document.createElement("video");
        video.srcObject = videoStream;
        video.play();
        videoElRef.current = video;
        console.log("📷 Camera started");

        // Auto-start frame sending
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.width = 640;
          canvasRef.current.height = 480;
        }
        const canvas = canvasRef.current;
        frameIntervalRef.current = setInterval(() => {
          if (!sessionRef.current || !videoElRef.current) return;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoElRef.current, 0, 0, 640, 480);
          canvas.toBlob((blob) => {
            if (!blob) return;
            blob.arrayBuffer().then((buffer) => {
              sessionRef.current?.sendRealtimeInput({
                video: { data: arrayBufferToBase64(buffer), mimeType: "image/jpeg" },
              });
            });
          }, "image/jpeg", 0.7);
        }, 1000);
      } catch {
        console.warn("Camera unavailable, falling back to audio only");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } else {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Mic error:", err);
        return;
      }
    }

    const audioStream = new MediaStream(stream.getAudioTracks());
    micStreamRef.current = audioStream;
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    const source = audioContextRef.current.createMediaStreamSource(audioStream);
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current.onaudioprocess = (e) => {
      if (!micActiveRef.current || !sessionRef.current) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = float32ToPCM16(float32);
      sessionRef.current.sendRealtimeInput({
        audio: { data: arrayBufferToBase64(pcm16.buffer), mimeType: "audio/pcm;rate=16000" },
      });
    };
    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
    console.log("🎤 Mic started");
  }

  // ─────────────────────────────────────────
  // Connect
  // ─────────────────────────────────────────
  async function connect() {
    if (isConnectingRef.current || sessionRef.current) return;
    isConnectingRef.current = true;
    intentionalCloseRef.current = false;
    setIsDropped(false);

    try {
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        httpOptions: { apiVersion: "v1beta" },
      });

      sessionRef.current = await ai.live.connect({
        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",

        config: {
          responseModalities: ["AUDIO"],
          mediaResolution: "MEDIA_RESOLUTION_LOW",
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
          outputAudioTranscription: {},
          systemInstruction: systemPrompt,
          tools: [{
            functionDeclarations: [
            {
              name: "submit_tip",
              description: "Call this after every user turn to deliver a coaching tip.",
              parameters: {
                type: "OBJECT",
                properties: {
                  tip: { type: "STRING", description: "One short encouraging or corrective coaching sentence." },
                },
                required: ["tip"],
              },
            },
            {
              name: "submit_metrics",
              description: "Call this at the end of the conversation to submit your assessment of the user's communication performance.",
              parameters: {
                type: "OBJECT",
                properties: {
                  talk_ratio_user: { type: "NUMBER", description: "Fraction of conversation the user contributed (0.0-1.0)" },
                  questions_asked: { type: "INTEGER", description: "Number of open-ended questions the user asked" },
                  filler_words: { type: "INTEGER", description: "Count of filler words like um/uh/like the user used" },
                  sentiment: { type: "STRING", description: "Overall rapport trend: warming, neutral, or cooling" },
                  anxiety_audio: { type: "BOOLEAN", description: "Whether the user seemed nervous based on their language" },
                  speech_pace: { type: "STRING", description: "slow, normal, or fast" },
                  voice_confidence: { type: "NUMBER", description: "How confident the user sounded (0.0-1.0)" },
                  engagement_score: { type: "NUMBER", description: "How engaged the conversation was (0.0-1.0)" },
                  eye_contact: { type: "NUMBER", description: "How consistently the user looked at the camera (0.0-1.0). Default 0.5 if no video." },
                  posture: { type: "STRING", description: "User's posture observed via camera: upright, slouched, or tense. Default upright if no video." },
                  strengths: { type: "ARRAY", items: { type: "STRING" }, description: "Up to 3 things the user did well" },
                  focus_areas: { type: "ARRAY", items: { type: "STRING" }, description: "Up to 3 things to improve" },
                },
                required: ["talk_ratio_user", "questions_asked", "filler_words", "sentiment", "voice_confidence", "eye_contact", "posture", "strengths", "focus_areas"],
              },
            }],
          }],

        },

        callbacks: {
          onopen: async () => {
            console.log("✅ Gemini connected");
            const isReconnect = !!metricsTranscriptRef.current.trim();
            reconnectAttemptsRef.current = 0;
            setIsDropped(false);
            await startMedia();
            setIsConnected(true);

            if (isReconnect) {
              // Resume — give Gemini the conversation history so it can continue
              sessionRef.current?.sendClientContent({
                turns: [{ role: "user", parts: [{ text: `The connection was briefly interrupted. Here is our conversation so far:\n\n${metricsTranscriptRef.current}\n\nPlease continue naturally from where we left off, without restarting or re-introducing yourself.` }] }],
                turnComplete: true,
              });
            } else {
              // Fresh start — nudge Gemini to deliver its opening line
              sessionRef.current?.sendClientContent({
                turns: [{ role: "user", parts: [{ text: "Please start the conversation." }] }],
                turnComplete: true,
              });
            }
          },

          onclose: (e) => {
            console.log("❌ Gemini closed:", e?.code, e?.reason);

            setIsConnected(false);
            setIsSpeaking(false);
            sessionRef.current = null;
            isConnectingRef.current = false;

            if (!intentionalCloseRef.current) {
              console.warn("⚠️ Session dropped unexpectedly:", e?.code, e?.reason);

              if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                const delay = 1500 * (reconnectAttemptsRef.current + 1);
                reconnectAttemptsRef.current += 1;
                console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
                reconnectTimerRef.current = setTimeout(() => connect(), delay);
              } else {
                console.warn("❌ Max reconnect attempts reached");
                setIsDropped(true);
                reconnectAttemptsRef.current = 0;
              }
            }
          },

          onerror: (e) => {
            console.error("Gemini error:", e);
          },

          onmessage: (message) => {
            // Tool calls
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls ?? [];
              for (const fn of calls) {
                if (fn.name === "submit_tip") {
                  console.log("💡 submit_tip:", fn.args.tip);
                  setLiveTip(fn.args.tip);
                  if (onMetricsRef.current) onMetricsRef.current({ tip: fn.args.tip });
                } else if (fn.name === "submit_metrics") {
                  console.log("📊 submit_metrics:", fn.args);
                  finalMetricsRef.current = fn.args;
                  if (onMetricsRef.current) onMetricsRef.current({ finalMetrics: fn.args });
                }
              }
              // Acknowledge all calls so the model doesn't wait
              try {
                sessionRef.current?.sendToolResponse({
                  functionResponses: calls.map((fn) => ({ id: fn.id, name: fn.name, response: { result: "ok" } })),
                });
              } catch {
                // Session already closed — drop silently
              }
              return;
            }

            const sc = message.serverContent;
            if (!sc) return;

            const parts = sc?.modelTurn?.parts ?? [];

            // AUDIO
            for (const part of parts) {
              if (part.inlineData?.data) {
                setIsSpeaking(true);
                playAudioChunk(
                  part.inlineData.data,
                  playbackCtxRef,
                  nextStartTimeRef,
                  setIsSpeaking,
                );
              }
            }

            // Non-thought text parts (JSON metrics from native audio model)
            for (const part of parts) {
              if (part.text && !part.thought) {
                console.log("📝 inline text:", part.text.slice(0, 120));
                textBufferRef.current += part.text;
              }
            }

            // Input audio transcription — user's speech
            if (sc.inputTranscription?.text?.trim()) {
              userSpokeRef.current = true;
            }

            // Output audio transcription — JS equivalent of Python's response.text
            if (sc.outputTranscription?.text) {
              console.log("📝 transcription:", sc.outputTranscription.text.slice(0, 120));
              textBufferRef.current += sc.outputTranscription.text;
            }

            if (sc.turnComplete) {
              console.log("✅ turnComplete, buffer:", textBufferRef.current.slice(0, 300));
              // Store full turn text for debrief transcript
              if (textBufferRef.current.trim()) {
                metricsTranscriptRef.current += textBufferRef.current + "\n---\n";
              }
              textBufferRef.current = "";
            }
          },
        },
      });
    } catch (err) {
      console.error("Failed to connect:", err);

      sessionRef.current = null;
      isConnectingRef.current = false;
    }
  }

  // ─────────────────────────────────────────
  // Disconnect
  // ─────────────────────────────────────────
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;

    processorRef.current?.disconnect();
    processorRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }

    audioContextRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    videoElRef.current?.pause();
    videoElRef.current = null;
    videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    videoStreamRef.current = null;
    canvasRef.current = null;
    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    reconnectAttemptsRef.current = 0;
    intentionalCloseRef.current = true;
    sessionRef.current?.close();
    sessionRef.current = null;

    resetAudioQueue(playbackCtxRef, nextStartTimeRef);

    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  function toggleMic() {
    const track = micStreamRef.current?.getAudioTracks()[0];

    if (track) {
      track.enabled = !track.enabled;
    }

    micActiveRef.current = !micActiveRef.current;
    setMicActive((v) => !v);
  }

  function getTranscript() {
    return metricsTranscriptRef.current;
  }

  function hasUserSpoken() {
    return userSpokeRef.current;
  }

  function getMetrics() {
    return finalMetricsRef.current;
  }

  function requestMetrics() {
    sessionRef.current?.sendClientContent({
      turns: [{ role: "user", parts: [{ text: "The session is ending now. Please call submit_metrics with your full assessment of our conversation." }] }],
      turnComplete: true,
    });
  }

  return {
    connect,
    disconnect,
    isConnected,
    isDropped,
    isSpeaking,
    micActive,
    toggleMic,
    videoStream: videoStreamRef,
    liveTip,
    getTranscript,
    getMetrics,
    hasUserSpoken,
    requestMetrics,
  };
}

function playAudioChunk(base64, playbackCtxRef, nextStartTimeRef, onEnded) {
  if (!playbackCtxRef.current) {
    playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
    nextStartTimeRef.current = playbackCtxRef.current.currentTime;
  }

  const ctx = playbackCtxRef.current;

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const samples = bytes.length / 2;

  const audioBuffer = ctx.createBuffer(1, samples, 24000);
  const channelData = audioBuffer.getChannelData(0);

  const view = new DataView(bytes.buffer);

  for (let i = 0; i < samples; i++) {
    channelData[i] = view.getInt16(i * 2, true) / 32768;
  }

  const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);

  nextStartTimeRef.current = startTime + audioBuffer.duration;

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(startTime);

  source.onended = () => {
    if (nextStartTimeRef.current <= ctx.currentTime + 0.05) {
      onEnded(false);
    }
  };
}

function resetAudioQueue(playbackCtxRef, nextStartTimeRef) {
  nextStartTimeRef.current = 0;

  if (playbackCtxRef.current) {
    playbackCtxRef.current.close().catch(() => {});
    playbackCtxRef.current = null;
  }
}

function float32ToPCM16(float32Array) {
  const pcm = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return pcm;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
