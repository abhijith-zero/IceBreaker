/**
 * DifficultyBadge
 * Props: difficulty — "beginner" | "intermediate" | "advanced"
 */
const CONFIG = {
  beginner: { label: "Beginner", color: "#10B981", dots: 1 },
  medium: { label: "Intermediate", color: "#F59E0B", dots: 2 },
  hard: { label: "Advanced", color: "#EF4444", dots: 3 },
};

export function DifficultyBadge({ difficulty }) {
  const cfg = CONFIG[difficulty?.toLowerCase()] ?? CONFIG.beginner;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
      style={{
        color: cfg.color,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}35`,
      }}
    >
      {/* Signal-bar dots */}
      <span className="flex gap-0.5 items-end">
        {[1, 2, 3].map((lvl) => (
          <span
            key={lvl}
            className="inline-block w-0.75 rounded-sm"
            style={{
              height: `${4 + lvl * 2}px`,
              background: lvl <= cfg.dots ? cfg.color : `${cfg.color}30`,
            }}
          />
        ))}
      </span>
      {cfg.label}
    </span>
  );
}
