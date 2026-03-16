import { DifficultyBadge } from "./DifficultyBadge";

const ICONS = {
  coffee_chat: "☕",
  conference: "🎤",
  interview: "💼",
  networking: "🤝",
  virtual: "💻",
};

const ACCENTS = {
  coffee_chat: "#D97706",
  conference: "#7C3AED",
  interview: "#2563EB",
  networking: "#059669",
  virtual: "#DC2626",
};

/**
 * ScenarioCard
 * Props:
 *   scenario       { id, name, difficulty, persona_name, persona_role, description }
 *   isLoading      bool
 *   isDisabled     bool
 *   animationDelay number (ms)
 *   onSelect       fn(scenario)
 */
export function ScenarioCard({
  scenario,
  isLoading,
  isDisabled,
  animationDelay = 0,
  onSelect,
}) {
  const icon = ICONS[scenario.id] ?? "💬";
  const accent = ACCENTS[scenario.id] ?? "#4ECDC4";

  return (
    <button
      onClick={() => !isDisabled && !isLoading && onSelect(scenario)}
      disabled={isDisabled || isLoading}
      className="group relative text-left rounded-2xl border border-white/6 bg-[#111827] p-6
                 transition-all duration-300
                 hover:border-white/20 hover:bg-[#151E2D] hover:scale-[1.02] hover:shadow-xl
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDC4]/50"
      style={{
        animation: `fadeSlideUp 0.45s ease forwards`,
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${accent}12 0%, transparent 65%)`,
        }}
      />

      {/* Icon + badge row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${accent}1A`, border: `1px solid ${accent}30` }}
        >
          {icon}
        </div>
        <DifficultyBadge difficulty={scenario.difficulty} />
      </div>

      {/* Name */}
      <h3 className="text-[15px] font-semibold text-white mb-1">
        {scenario.name}
      </h3>

      <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">
        {scenario.opening_line}
      </p>

      {/* Persona chip */}
      <div className="flex items-center gap-2">
        <PersonaAvatar name={scenario.persona_name} accent={accent} />
        <div>
          <p className="text-[12px] font-medium text-[#9CA3AF]">
            {scenario.persona_name}
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-2xl bg-[#111827]/80 flex items-center justify-center">
          <LoadingDots accent={accent} />
        </div>
      )}

      {/* Arrow hint */}
      <span className="absolute bottom-6 right-6 text-[#4ECDC4] opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </span>
    </button>
  );
}

function PersonaAvatar({ name, accent }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{ background: `${accent}35`, border: `1px solid ${accent}55` }}
    >
      {initials}
    </div>
  );
}

function LoadingDots({ accent }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: accent, animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
