import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

export function useGeminiLive({ systemPrompt, onMetrics }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [liveTip, setLiveTip] = useState(null);

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const micStreamRef = useRef(null);
  const micActiveRef = useRef(true);
  const isConnectingRef = useRef(false);

  const playbackCtxRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  const metricsTranscriptRef = useRef("");
  const textBufferRef = useRef("");

  const onMetricsRef = useRef(onMetrics);

  useEffect(() => {
    onMetricsRef.current = onMetrics;
  }, [onMetrics]);

  // ─────────────────────────────────────────
  // Mic Capture
  // ─────────────────────────────────────────
  async function startMic() {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      micStreamRef.current = micStream;

      // Must match the mimeType rate sent to Gemini — browser will resample to 16 kHz
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(micStream);

      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );

      processorRef.current.onaudioprocess = (e) => {
        if (!micActiveRef.current || !sessionRef.current) return;

        const float32 = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToPCM16(float32);

        const base64 = arrayBufferToBase64(pcm16.buffer);

        // const sampleRate = audioContextRef.current.sampleRate;

        sessionRef.current.sendRealtimeInput({
          audio: {
            data: base64,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      console.log("🎤 Mic started");
    } catch (err) {
      console.error("Mic error:", err);
    }
  }

  // ─────────────────────────────────────────
  // Tip Parser
  // ─────────────────────────────────────────
  function tryParseTip(text) {
    const match = text.match(/Coaching tip:\s*(.+)/i);
    if (match) {
      const tip = match[1].trim();
      setLiveTip(tip);
      if (onMetricsRef.current) onMetricsRef.current({ tip });
    }
  }

  // ─────────────────────────────────────────
  // Connect
  // ─────────────────────────────────────────
  const connect = useCallback(async () => {
    if (isConnectingRef.current || sessionRef.current) return;
    isConnectingRef.current = true;

    try {
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        httpOptions: { apiVersion: "v1beta" },
      });

      sessionRef.current = await ai.live.connect({
        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",

        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" },
            },
          },
          outputAudioTranscription: {},
          systemInstruction: systemPrompt,
        },

        callbacks: {
          onopen: async () => {
            console.log("✅ Gemini connected");
            setIsConnected(true);
            await startMic();
            // Nudge Gemini to deliver its opening line — the system instruction
            // already specifies the exact line to use for this scenario.
            sessionRef.current?.sendClientContent({
              turns: [{ role: "user", parts: [{ text: "Please start the conversation." }] }],
              turnComplete: true,
            });
          },

          onclose: (e) => {
            console.log("❌ Gemini closed:", e?.code, e?.reason);

            setIsConnected(false);
            setIsSpeaking(false);

            sessionRef.current = null;
            isConnectingRef.current = false;
          },

          onerror: (e) => {
            console.error("Gemini error:", e);
          },

          onmessage: (message) => {
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
              tryParseTip(textBufferRef.current);
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
  }, [systemPrompt]);

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

  return {
    connect,
    disconnect,
    isConnected,
    isSpeaking,
    micActive,
    toggleMic,
    liveTip,
    getTranscript,
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
