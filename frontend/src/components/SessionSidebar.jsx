import { DifficultyBadge } from "./DifficultyBadge";

const ACCENTS = {
  warmup: "#D97706",
  tech_mixer: "#7C3AED",
  conference: "#2563EB",
  weak_tie: "#059669",
  cold_intro: "#DC2626",
};

/**
 * SessionSidebar
 * Props:
 *   scenario       { id, name, difficulty, persona_name, opening_line }
 *   timer          string "mm:ss"
 *   talkRatio      number 0-1
 *   isConnected    bool
 *   onEnd          fn()
 */
export function SessionSidebar({
  scenario,
  timer,
  talkRatio = 0,
  isConnected,
  onEnd,
}) {
  const accent = ACCENTS[scenario?.id] ?? "#4ECDC4";
  const initials = scenario?.persona_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-70 shrink-0 flex flex-col gap-4 h-screen sticky top-0 p-5 border-r border-white/6 bg-[#0D1117]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#4ECDC4] to-[#2B6CB0] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="white" />
            <path
              d="M8 1v2M8 13v2M1 8h2M13 8h2"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4ECDC4]">
          Icebreaker
        </span>
      </div>

      <div className="h-px bg-white/6" />

      {/* Scenario info */}
      <div>
        <p className="text-[11px] text-[#4B5563] uppercase tracking-widest mb-2">
          Current Scenario
        </p>
        <h2 className="text-[15px] font-semibold text-white mb-1.5">
          {scenario?.name}
        </h2>
        <DifficultyBadge difficulty={scenario?.difficulty} />
      </div>

      {/* Persona */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
          style={{ background: `${accent}35`, border: `1px solid ${accent}55` }}
        >
          {initials}
        </div>
        <div>
          <p className="text-[13px] font-medium text-white">
            {scenario?.persona_name}
          </p>
          <p className="text-[11px] text-[#4B5563]">AI Persona</p>
        </div>
        {/* Connection status dot */}
        <div className="ml-auto relative">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#10B981]" : "bg-[#4B5563]"}`}
          />
          {isConnected && (
            <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-50" />
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/6 text-center">
        <p className="text-[11px] text-[#4B5563] uppercase tracking-widest mb-1">
          Session Time
        </p>
        <p className="text-3xl font-bold tracking-tight font-mono text-white">
          {timer}
        </p>
      </div>

      {/* Talk ratio */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] text-[#4B5563] uppercase tracking-widest">
            Talk Ratio
          </p>
          <p className="text-[12px] font-mono text-white">
            {Math.round(talkRatio * 100)}%
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${talkRatio * 100}%`,
              background:
                talkRatio > 0.65
                  ? "#EF4444"
                  : talkRatio > 0.45
                    ? "#10B981"
                    : "#F59E0B",
            }}
          />
        </div>
        <p className="text-[10px] text-[#374151] mt-1.5">Ideal: 40–60%</p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* End session */}
      <button
        onClick={onEnd}
        className="w-full py-3 rounded-xl border border-red-500/25 text-red-400 text-[13px] font-medium
                   hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-200"
      >
        End Session
      </button>
    </aside>
  );
}
