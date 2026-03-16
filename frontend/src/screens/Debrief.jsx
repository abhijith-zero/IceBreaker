import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/**
 * Debrief — Screen 3
 * Props:
 *   debrief   { score, strengths, focus_areas, sentiment_arc, confidence_arc }
 *   scenario  { name, persona_name }
 *   onHome    fn()
 *   onViewProgress fn()
 */
export function Debrief({ debrief, scenario, onHome, onViewProgress }) {
  if (!debrief) return null;

  const { score, strengths, focus_areas, sentiment_arc, confidence_arc } =
    debrief;

  // Convert sentiment arc strings to numbers for chart
  const sentimentMap = { warming: 1, neutral: 0.5, cooling: 0 };
  const chartData = (confidence_arc ?? []).map((conf, i) => ({
    turn: i + 1,
    confidence: parseFloat((conf * 100).toFixed(1)),
    sentiment: parseFloat(
      ((sentimentMap[sentiment_arc?.[i]] ?? 0.5) * 100).toFixed(1),
    ),
  }));

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ animation: "fadeSlideUp 0.4s ease forwards" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#4ECDC4] to-[#2B6CB0] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2.5" fill="white" />
                  <path
                    d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4ECDC4]">
                Icebreaker
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">Session Complete</h1>
            <p className="text-[#6B7280] text-sm mt-1">
              {scenario?.name} · with {scenario?.persona_name}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onViewProgress}
              className="px-4 py-2 rounded-xl border border-white/8 text-[13px] text-[#9CA3AF] hover:text-white hover:border-white/20 transition-all"
            >
              View Progress
            </button>
            <button
              onClick={onHome}
              className="px-4 py-2 rounded-xl bg-[#4ECDC4] text-[#0A0E1A] text-[13px] font-semibold hover:bg-[#3DBDB4] transition-colors"
            >
              Practice Again
            </button>
          </div>
        </div>

        {/* Score row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{
            animation: "fadeSlideUp 0.4s ease forwards",
            animationDelay: "60ms",
            opacity: 0,
          }}
        >
          <ScoreRing
            value={score?.total ?? 0}
            label="Overall Score"
            accent="#4ECDC4"
            large
          />
          <ScoreBar
            value={score?.talk_ratio ?? 0}
            max={20}
            label="Talk Ratio"
            accent="#3B82F6"
          />
          <ScoreBar
            value={score?.questions_asked ?? 0}
            max={20}
            label="Questions"
            accent="#8B5CF6"
          />
          <ScoreBar
            value={score?.filler_words ?? 0}
            max={15}
            label="Filler Words"
            accent="#F59E0B"
          />
        </div>

        {/* Second score row */}
        <div
          className="grid grid-cols-3 gap-4"
          style={{
            animation: "fadeSlideUp 0.4s ease forwards",
            animationDelay: "120ms",
            opacity: 0,
          }}
        >
          <ScoreBar
            value={score?.posture_confidence ?? 0}
            max={15}
            label="Posture"
            accent="#10B981"
          />
          <ScoreBar
            value={score?.sentiment_trend ?? 0}
            max={15}
            label="Sentiment"
            accent="#EC4899"
          />
          <ScoreBar
            value={score?.recovery_moments ?? 0}
            max={15}
            label="Recovery"
            accent="#F97316"
          />
        </div>

        {/* Strengths + Focus areas */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{
            animation: "fadeSlideUp 0.4s ease forwards",
            animationDelay: "180ms",
            opacity: 0,
          }}
        >
          <FeedbackCard
            title="Strengths"
            icon="✅"
            items={strengths ?? []}
            accent="#10B981"
          />
          <FeedbackCard
            title="Focus Areas"
            icon="🎯"
            items={focus_areas ?? []}
            accent="#F59E0B"
          />
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{
              animation: "fadeSlideUp 0.4s ease forwards",
              animationDelay: "240ms",
              opacity: 0,
            }}
          >
            <ChartCard
              title="Confidence Arc"
              dataKey="confidence"
              data={chartData}
              color="#4ECDC4"
            />
            <ChartCard
              title="Sentiment Arc"
              dataKey="sentiment"
              data={chartData}
              color="#8B5CF6"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────
function ScoreRing({ value, label, accent, large }) {
  const radius = large ? 44 : 36;
  const stroke = large ? 6 : 5;
  const size = (radius + stroke) * 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(value, 100) / 100) * circ;

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111827] p-5 flex flex-col items-center justify-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize={large ? 20 : 16}
          fontWeight="700"
          fontFamily="Sora, sans-serif"
        >
          {Math.round(value)}
        </text>
      </svg>
      <p className="text-[11px] text-[#6B7280] uppercase tracking-widest text-center">
        {label}
      </p>
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────────────────────
function ScoreBar({ value, max, label, accent }) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111827] p-5">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[12px] text-[#6B7280]">{label}</p>
        <p className="text-[13px] font-semibold text-white font-mono">
          {value.toFixed(1)}
          <span className="text-[#4B5563] text-[10px]">/{max}</span>
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
    </div>
  );
}

// ── Feedback Card ──────────────────────────────────────────────────────────
function FeedbackCard({ title, icon, items, accent }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#111827] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span>{icon}</span>
        <p className="text-[13px] font-semibold text-white">{title}</p>
      </div>
      <ul className="space-y-2.5">
        {items.length === 0 ? (
          <li className="text-[13px] text-[#4B5563]">Nothing to show</li>
        ) : (
          items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                style={{ background: accent }}
              />
              <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                {item}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ── Chart Card ─────────────────────────────────────────────────────────────
function ChartCard({ title, dataKey, data, color }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#111827] p-5">
      <p className="text-[13px] font-semibold text-white mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="turn"
            tick={{ fill: "#4B5563", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#4B5563", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1F2937",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
            itemStyle={{ color: color, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
