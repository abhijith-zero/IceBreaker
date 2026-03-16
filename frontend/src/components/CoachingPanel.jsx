import { useEffect, useRef } from "react";

const QUICK_TIPS = [
  "Maintain eye contact with the camera",
  "Keep your shoulders relaxed and open",
  "Ask follow-up questions to show interest",
  "Avoid filler words like 'um' and 'uh'",
  "Mirror the other person's energy level",
];

/**
 * CoachingPanel
 * Props:
 *   liveTip      string | null — latest tip from Gemini
 *   isConnected  bool
 */
export function CoachingPanel({ liveTip, isConnected }) {
  const tipRef = useRef(null);
  const prevTip = useRef(null);

  // Animate when tip changes
  useEffect(() => {
    if (!liveTip || liveTip === prevTip.current) return;
    prevTip.current = liveTip;

    if (tipRef.current) {
      tipRef.current.style.animation = "none";
      tipRef.current.offsetHeight; // reflow
      tipRef.current.style.animation = "fadeSlideUp 0.4s ease forwards";
    }
  }, [liveTip]);

  return (
    <div className="flex flex-col gap-4">
      {/* Live Coaching card */}
      <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5">
        <div className="flex items-center gap-2 mb-4">
          {/* Pulsing dot when connected */}
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#EAB308]" : "bg-[#374151]"}`}
            />
            {isConnected && (
              <div className="absolute inset-0 rounded-full bg-[#EAB308]/30 animate-ping" />
            )}
          </div>
          <p className="text-[13px] font-semibold text-(--fg)">Live Coaching</p>
          {isConnected && (
            <span className="ml-auto text-[10px] text-[#EAB308] bg-[#EAB308]/10 px-2 py-0.5 rounded-full border border-[#EAB308]/20">
              LIVE
            </span>
          )}
        </div>

        {/* Tip display */}
        <div className="min-h-20 flex items-center justify-center">
          {liveTip ? (
            <div ref={tipRef} className="flex gap-3 items-start">
              <span className="text-[#EAB308] text-lg shrink-0 mt-0.5">💡</span>
              <p className="text-[14px] text-(--fg) leading-relaxed">
                {liveTip}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-[#374151] text-3xl mb-2">✦</div>
              <p className="text-[13px] text-(--subtle)">
                {isConnected
                  ? "Listening… coaching tips will appear here"
                  : "Start a session to receive real-time coaching tips"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips card */}
      <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#F59E0B]">⚡</span>
          <p className="text-[13px] font-semibold text-(--fg)">Quick Tips</p>
        </div>
        <ul className="space-y-2">
          {QUICK_TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#374151] shrink-0 mt-1.5" />
              <p className="text-[13px] text-(--muted) leading-relaxed">
                {tip}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
