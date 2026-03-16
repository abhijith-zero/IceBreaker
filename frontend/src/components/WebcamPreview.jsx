/**
 * WebcamPreview
 * Props:
 *   videoRef    React ref — passed in from PracticeSession so useGeminiLive can also use it
 *   camActive   bool
 *   micActive   bool
 *   isSpeaking  bool — Gemini is speaking
 */
export function WebcamPreview({ videoRef, camActive, micActive, isSpeaking }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-(--bg) border border-(--border-color) aspect-video w-full">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${camActive ? "opacity-100" : "opacity-0"}`}
      />

      {/* Camera off state */}
      {!camActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--bg)">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-(--subtle) text-sm">Camera off</p>
          </div>
        </div>
      )}

      {/* Gemini speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
          <SoundWave />
          <span className="text-[11px] text-white font-medium">
            AI Speaking
          </span>
        </div>
      )}

      {/* Mic muted badge */}
      {!micActive && (
        <div className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
          <span className="text-[11px] text-white font-medium">🔇 Muted</span>
        </div>
      )}

      {/* You label */}
      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
        <span className="text-[11px] text-white/70">You</span>
      </div>
    </div>
  );
}

function SoundWave() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[1, 2, 3, 2, 1].map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-[#EAB308] animate-bounce"
          style={{
            height: `${h * 4}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
}
