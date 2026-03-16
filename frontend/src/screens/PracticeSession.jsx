import { useEffect, useState, useCallback, useRef } from "react";
import { SessionSidebar } from "../components/SessionSidebar";
import { CoachingPanel } from "../components/CoachingPanel";
import { WebcamPreview } from "../components/WebcamPreview";
import { useGeminiLive } from "../hooks/useGeminiLive";
import { useSessionTimer } from "../hooks/useSessionTimer";
import { api } from "../lib/api";

export function PracticeSession({ context, onSessionEnd, onExit }) {
  const { scenario, systemPrompt, sessionId } = context;

  const [started, setStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [liveTipState, setLiveTipState] = useState(null);

  const { formatted: timerDisplay } = useSessionTimer(started);

  const handleMetrics = useCallback((metrics) => {
    console.log("📊 Metrics:", metrics);
    if (metrics.tip) setLiveTipState(metrics.tip);
  }, []);

  const videoPreviewRef = useRef(null);

  const {
    connect,
    disconnect,
    isConnected,
    isSpeaking,
    micActive,
    toggleMic,
    cameraActive,
    toggleCamera,
    videoStream,
    liveTip,
    getTranscript,
    getMetrics,
    requestMetrics,
  } = useGeminiLive({ systemPrompt, onMetrics: handleMetrics });

  // Wire webcam stream to the preview element
  useEffect(() => {
    if (videoPreviewRef.current && videoStream.current) {
      videoPreviewRef.current.srcObject = videoStream.current;
    }
  }, [cameraActive, videoStream]);

  useEffect(() => {
    return () => disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart() {
    setStarted(true);
    await connect();
  }

  async function handleEnd() {
    if (isEnding) return;
    setIsEnding(true);

    // Ask the model to call submit_metrics, wait up to 8s for the tool call
    requestMetrics();
    await new Promise((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (getMetrics() || Date.now() - start > 8000) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });

    disconnect();
    try {
      const transcript = getTranscript();
      const metrics = getMetrics();
      console.log("📤 Sending transcript:", transcript.slice(0, 200));
      console.log("📊 Sending metrics:", metrics);
      const res = await api.endSession(sessionId, { transcript, metrics });
      onSessionEnd(res.debrief);
    } catch (err) {
      console.error("Failed to end session:", err);
      setIsEnding(false);
    }
  }

  const displayTip = liveTip || liveTipState;

  return (
    <div className="flex min-h-screen bg-[#0A0E1A]">
      <SessionSidebar
        scenario={scenario}
        timer={timerDisplay}
        isConnected={isConnected}
        onEnd={handleEnd}
        onHome={onExit}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <div>
            <h1 className="text-lg font-semibold text-white">Practice Arena</h1>
            <p className="text-[12px] text-[#4B5563]">
              {!started
                ? "Ready to start"
                : isConnected
                  ? `Talking with ${scenario.persona_name}`
                  : "Connecting…"}
            </p>
          </div>
          {started && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                  ${
                    micActive
                      ? "bg-white/6 border border-white/10 hover:bg-white/10"
                      : "bg-red-500/10 border border-red-500/25 hover:bg-red-500/20"
                  }`}
              >
                {micActive ? "🎤" : "🔇"}
              </button>
              <button
                onClick={toggleCamera}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                  ${
                    cameraActive
                      ? "bg-white/6 border border-white/10 hover:bg-white/10"
                      : "bg-red-500/10 border border-red-500/25 hover:bg-red-500/20"
                  }`}
              >
                {cameraActive ? "📷" : "🚫"}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 p-6">
          {/* Left — persona */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/6 bg-[#111827] aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                {!started ? (
                  <>
                    <PersonaAvatar
                      name={scenario.persona_name}
                      isSpeaking={false}
                      isConnected={false}
                    />
                    <p className="text-[13px] text-[#6B7280]">
                      Ready to talk with {scenario.persona_name}
                    </p>
                    <button
                      onClick={handleStart}
                      className="px-6 py-2.5 rounded-xl bg-[#4ECDC4] text-[#0A0E1A] text-sm font-semibold hover:bg-[#3DBDB4] transition-colors"
                    >
                      Start Session
                    </button>
                  </>
                ) : (
                  <>
                    <PersonaAvatar
                      name={scenario.persona_name}
                      isSpeaking={isSpeaking}
                      isConnected={isConnected}
                    />
                    <p className="text-[13px] text-[#6B7280]">
                      {isSpeaking
                        ? `${scenario.persona_name} is speaking…`
                        : isConnected
                          ? "Listening to you…"
                          : "Connecting…"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Webcam preview — shown when session is active */}
            {started && (
              <WebcamPreview
                videoRef={videoPreviewRef}
                camActive={cameraActive}
                micActive={micActive}
                isSpeaking={isSpeaking}
              />
            )}

            {/* Opening line */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <p className="text-[11px] text-[#4B5563] uppercase tracking-widest mb-1">
                {scenario.persona_name} opened with
              </p>
              <p className="text-[13px] text-[#9CA3AF] italic">
                "{scenario.opening_line}"
              </p>
            </div>
          </div>

          {/* Right — live coaching */}
          <CoachingPanel liveTip={displayTip} isConnected={isConnected} />
        </div>

        {/* Ending overlay */}
        {isEnding && (
          <div className="absolute inset-0 bg-[#0A0E1A]/90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#4ECDC4]/20 border-t-[#4ECDC4] animate-spin" />
              <p className="text-white text-sm">Generating your debrief…</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PersonaAvatar({ name, isSpeaking, isConnected }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative inline-flex items-center justify-center mx-auto">
      {isSpeaking && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-[#4ECDC4]/10 animate-ping" />
          <div
            className="absolute w-20 h-20 rounded-full bg-[#4ECDC4]/15 animate-ping"
            style={{ animationDelay: "150ms" }}
          />
        </>
      )}
      <div
        className={`relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all duration-300
        ${isConnected ? "bg-[#4ECDC4]/20 border-2 border-[#4ECDC4]/50" : "bg-white/6 border-2 border-white/10"}`}
      >
        {initials}
      </div>
    </div>
  );
}
