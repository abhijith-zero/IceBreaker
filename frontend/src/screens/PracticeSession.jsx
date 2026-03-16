import { useEffect, useState, useCallback, useRef } from "react";
import { SessionSidebar } from "../components/SessionSidebar";
import { CoachingPanel } from "../components/CoachingPanel";
import { WebcamPreview } from "../components/WebcamPreview";
import { ThemeToggle } from "../components/ThemeToggle";
import { useGeminiLive } from "../hooks/useGeminiLive";
import { useSessionTimer } from "../hooks/useSessionTimer";
import { api } from "../lib/api";

export function PracticeSession({ context, onSessionEnd, onExit }) {
  const { scenario, systemPrompt, voice, sessionId } = context;

  const [started, setStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [noParticipation, setNoParticipation] = useState(false);
  const [liveTipState, setLiveTipState] = useState(null);
  const [mediaMode, setMediaMode] = useState("audio"); // "audio" | "video"

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
    isDropped,
    isSpeaking,
    micActive,
    toggleMic,
    videoStream,
    liveTip,
    getTranscript,
    getMetrics,
    hasUserSpoken,
    requestMetrics,
  } = useGeminiLive({
    systemPrompt,
    voice,
    withVideo: mediaMode === "video",
    onMetrics: handleMetrics,
  });

  // Wire webcam stream to the preview element — runs after isConnected (which fires post-startMedia)
  useEffect(() => {
    if (isConnected && videoPreviewRef.current && videoStream.current) {
      videoPreviewRef.current.srcObject = videoStream.current;
    }
  }, [isConnected, videoStream]);

  function releaseMedia() {
    disconnect();
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  }

  useEffect(() => {
    return () => releaseMedia();
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

    if (!hasUserSpoken()) {
      releaseMedia();
      setIsEnding(false);
      setNoParticipation(true);
      return;
    }

    releaseMedia();
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
    <div className="flex min-h-screen bg-(--bg)">
      <SessionSidebar
        scenario={scenario}
        timer={timerDisplay}
        isConnected={isConnected}
        onEnd={handleEnd}
        onHome={onExit}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-(--border-color)">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-(--fg)">
              Practice Arena
            </h1>
            <p className="text-[11px] md:text-[12px] text-(--subtle)">
              {!started
                ? "Ready to start"
                : isConnected
                  ? `Talking with ${scenario.persona_name}`
                  : "Connecting…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer — mobile only */}
            {started && (
              <span className="md:hidden font-mono text-sm font-bold text-(--fg) tabular-nums">
                {timerDisplay}
              </span>
            )}
            <ThemeToggle />
            {started && (
              <button
                onClick={toggleMic}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg transition-all
                  ${
                    micActive
                      ? "bg-(--faint) border border-(--border-color) hover:bg-white/10"
                      : "bg-red-500/10 border border-red-500/25 hover:bg-red-500/20"
                  }`}
              >
                {micActive ? "🎤" : "🔇"}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6 pb-24 md:pb-6">
          {/* Left — persona */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-(--border-color) bg-(--surface) aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                {!started ? (
                  <>
                    <PersonaAvatar
                      name={scenario.persona_name}
                      isSpeaking={false}
                      isConnected={false}
                    />
                    <p className="text-[13px] text-(--muted)">
                      Ready to talk with {scenario.persona_name}
                    </p>
                    {/* Media mode picker */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setMediaMode("audio")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                          ${
                            mediaMode === "audio"
                              ? "bg-[#EAB308]/15 border-[#EAB308]/50 text-[#EAB308]"
                              : "bg-(--faint) border-(--border-color) text-(--muted) hover:border-(--subtle)"
                          }`}
                      >
                        🎤 Audio only
                      </button>
                      <button
                        onClick={() => setMediaMode("video")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                          ${
                            mediaMode === "video"
                              ? "bg-[#EAB308]/15 border-[#EAB308]/50 text-[#EAB308]"
                              : "bg-(--faint) border-(--border-color) text-(--muted) hover:border-(--subtle)"
                          }`}
                      >
                        📷 Audio + Camera
                      </button>
                    </div>
                    <button
                      onClick={handleStart}
                      className="px-6 py-2.5 rounded-xl bg-[#EAB308] text-[#09090b] text-sm font-semibold hover:bg-[#CA8A04] transition-colors"
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
                    <p className="text-[13px] text-(--muted)">
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

            {/* Webcam preview — shown when session is active with video */}
            {started && mediaMode === "video" && (
              <WebcamPreview
                videoRef={videoPreviewRef}
                camActive={true}
                micActive={micActive}
                isSpeaking={isSpeaking}
              />
            )}

            {/* Opening line */}
            <div className="p-4 rounded-xl bg-(--faint) border border-(--border-color)">
              <p className="text-[11px] text-(--subtle) uppercase tracking-widest mb-1">
                {scenario.persona_name} will open with
              </p>
              <p className="text-[13px] text-(--muted) italic">
                "{scenario.opening_line}"
              </p>
            </div>
          </div>

          {/* Right — live coaching */}
          <CoachingPanel liveTip={displayTip} isConnected={isConnected} />
        </div>

        {/* Mobile bottom bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-(--border-color) bg-(--bg) z-40">
          <div>
            <p className="text-[11px] text-(--subtle) uppercase tracking-widest">
              Scenario
            </p>
            <p className="text-[13px] font-medium text-(--fg) truncate max-w-35">
              {scenario.name}
            </p>
          </div>
          <button
            onClick={handleEnd}
            disabled={isEnding || !started}
            className="px-4 py-2 rounded-xl border border-red-500/25 text-red-400 text-[13px] font-medium
                       hover:bg-red-500/10 disabled:opacity-40 transition-all"
          >
            End Session
          </button>
        </div>

        {/* Ending overlay */}
        {isEnding && (
          <div className="absolute inset-0 bg-(--bg)/90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#EAB308]/20 border-t-[#EAB308] animate-spin" />
              <p className="text-(--fg) text-sm">Generating your debrief…</p>
            </div>
          </div>
        )}

        {/* No participation overlay */}
        {noParticipation && (
          <div className="absolute inset-0 bg-(--bg)/90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-xl">
                🎤
              </div>
              <div>
                <p className="text-(--fg) font-semibold">You didn't say anything</p>
                <p className="text-(--muted) text-sm mt-1">
                  Scores are only generated when you participate in the conversation.
                </p>
              </div>
              <button
                onClick={() => { setNoParticipation(false); onExit(); }}
                className="px-5 py-2 rounded-xl bg-[#EAB308] text-[#09090b] text-sm font-semibold hover:bg-[#CA8A04] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Session dropped overlay */}
        {isDropped && !isEnding && (
          <div className="absolute inset-0 bg-(--bg)/90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <p className="text-(--fg) font-semibold">
                  Session disconnected
                </p>
                <p className="text-(--muted) text-sm mt-1">
                  The connection was dropped by the server.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={connect}
                  className="px-5 py-2 rounded-xl bg-[#EAB308] text-[#09090b] text-sm font-semibold hover:bg-[#CA8A04] transition-colors"
                >
                  Reconnect
                </button>
                <button
                  onClick={() => { releaseMedia(); onExit(); }}
                  className="px-5 py-2 rounded-xl bg-(--faint) border border-(--border-color) text-(--muted) text-sm hover:text-(--fg) transition-colors"
                >
                  Exit
                </button>
              </div>
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
          <div className="absolute w-24 h-24 rounded-full bg-[#EAB308]/10 animate-ping" />
          <div
            className="absolute w-20 h-20 rounded-full bg-[#EAB308]/15 animate-ping"
            style={{ animationDelay: "150ms" }}
          />
        </>
      )}
      <div
        className={`relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-(--fg) transition-all duration-300
        ${isConnected ? "bg-[#EAB308]/20 border-2 border-[#EAB308]/50" : "bg-(--faint) border-2 border-(--border-color)"}`}
      >
        {initials}
      </div>
    </div>
  );
}
