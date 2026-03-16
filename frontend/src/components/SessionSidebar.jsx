import { DifficultyBadge } from "./DifficultyBadge";
import { IcebreakerLogo } from "./IcebreakerLogo";

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
 *   isConnected    bool
 *   onEnd          fn()
 */
export function SessionSidebar({
  scenario,
  timer,
  isConnected,
  onEnd,
  onHome,
}) {
  const accent = ACCENTS[scenario?.id] ?? "#EAB308";
  const initials = scenario?.persona_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden md:flex w-70 shrink-0 flex-col gap-4 h-screen sticky top-0 p-5 border-r border-(--border-color) bg-(--bg)">
      {/* Logo */}
      <div className="mb-2">
        <IcebreakerLogo size="md" onClick={onHome} />
      </div>

      <div className="h-px bg-(--border-color)" />

      {/* Scenario info */}
      <div>
        <p className="text-[11px] text-(--subtle) uppercase tracking-widest mb-2">
          Current Scenario
        </p>
        <h2 className="text-[15px] font-semibold text-(--fg) mb-1.5">
          {scenario?.name}
        </h2>
        <DifficultyBadge difficulty={scenario?.difficulty} />
      </div>

      {/* Persona */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-(--faint) border border-(--border-color)">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-(--fg) shrink-0"
          style={{ background: `${accent}35`, border: `1px solid ${accent}55` }}
        >
          {initials}
        </div>
        <div>
          <p className="text-[13px] font-medium text-(--fg)">
            {scenario?.persona_name}
          </p>
          <p className="text-[11px] text-(--subtle)">AI Persona</p>
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
      <div className="p-4 rounded-xl bg-(--faint) border border-(--border-color) text-center">
        <p className="text-[11px] text-(--subtle) uppercase tracking-widest mb-1">
          Session Time
        </p>
        <p className="text-3xl font-bold tracking-tight font-mono text-(--fg)">
          {timer}
        </p>
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
