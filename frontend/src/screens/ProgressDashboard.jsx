import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { api } from "../lib/api";
import { IcebreakerLogo } from "../components/IcebreakerLogo";
import { ThemeToggle } from "../components/ThemeToggle";

export function ProgressDashboard({ userId, onHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProgress(userId)
      .then(setData)
      .catch(() => setError("Could not load progress."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <FullPageSpinner />;

  if (error)
    return (
      <div className="min-h-screen bg-(--bg) flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );

  const sessions = data?.sessions ?? [];
  const totalSessions = data?.total_sessions ?? 0;
  const averageScore = data?.average_score ?? 0;
  const bestScore = sessions.length ? Math.max(...sessions.map((s) => s.score)) : 0;

  // Oldest-first for the chart
  const chronological = [...sessions].reverse();
  const improvement =
    chronological.length >= 2
      ? chronological[chronological.length - 1].score - chronological[0].score
      : null;

  const chartData = chronological.map((s, i) => ({
    session: i + 1,
    score: s.score,
    scenario: formatScenario(s.scenario_id),
  }));

  return (
    <div className="min-h-screen bg-(--bg) px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
          <div>
            <div className="mb-1">
              <IcebreakerLogo size="sm" />
            </div>
            <h1 className="text-3xl font-bold text-(--fg)">Your Progress</h1>
            <p className="text-(--muted) text-sm mt-1">{totalSessions} session{totalSessions !== 1 ? "s" : ""} completed</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onHome}
              className="px-4 py-2 rounded-xl bg-[#EAB308] text-[#09090b] text-[13px] font-semibold hover:bg-[#CA8A04] transition-colors"
            >
              Practice Again
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ animation: "fadeSlideUp 0.4s ease forwards", animationDelay: "60ms", opacity: 0 }}
        >
          <StatCard label="Sessions" value={totalSessions} unit="" accent="#EAB308" />
          <StatCard label="Average Score" value={averageScore.toFixed(1)} unit="/100" accent="#3B82F6" />
          <StatCard label="Best Score" value={bestScore.toFixed(1)} unit="/100" accent="#8B5CF6" />
          <ImprovementCard improvement={improvement} />
        </div>

        {/* Score over time */}
        {chartData.length > 0 && (
          <div
            className="rounded-2xl border border-(--border-color) bg-(--surface) p-5"
            style={{ animation: "fadeSlideUp 0.4s ease forwards", animationDelay: "120ms", opacity: 0 }}
          >
            <p className="text-[13px] font-semibold text-(--fg) mb-4">Score Over Time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="session"
                  tick={{ fill: "#4B5563", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Session", position: "insideBottom", offset: -2, fill: "#4B5563", fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#4B5563", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={averageScore} stroke="rgba(234,179,8,0.25)" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: "#27272a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                  labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
                  itemStyle={{ color: "#EAB308", fontSize: 12 }}
                  formatter={(v, _, props) => [`${v} — ${props.payload.scenario}`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={{ fill: "#EAB308", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Session history */}
        <div
          className="rounded-2xl border border-(--border-color) bg-(--surface) overflow-hidden"
          style={{ animation: "fadeSlideUp 0.4s ease forwards", animationDelay: "180ms", opacity: 0 }}
        >
          <div className="px-5 py-4 border-b border-(--border-color)">
            <p className="text-[13px] font-semibold text-(--fg)">Session History</p>
          </div>
          {sessions.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-(--subtle) text-center">No sessions yet — go practice!</p>
          ) : (
            <ul>
              {sessions.map((s, i) => (
                <li
                  key={s.session_id}
                  className={`flex items-center justify-between px-5 py-3.5 ${i !== sessions.length - 1 ? "border-b border-(--border-color)" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <ScorePill score={s.score} />
                    <div>
                      <p className="text-[13px] text-(--fg) font-medium">{formatScenario(s.scenario_id)}</p>
                      <p className="text-[11px] text-(--subtle)">{formatDate(s.created_at)}</p>
                    </div>
                  </div>
                  <ScoreTrend sessions={sessions} index={i} />
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, accent }) {
  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 flex flex-col items-center justify-center gap-1">
      <p className="text-2xl font-bold text-(--fg) font-mono">
        {value}<span className="text-(--subtle) text-sm">{unit}</span>
      </p>
      <p className="text-[11px] text-(--muted) uppercase tracking-widest text-center">{label}</p>
      <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: accent }} />
    </div>
  );
}

// ── Improvement Card ────────────────────────────────────────────────────────
function ImprovementCard({ improvement }) {
  const noData = improvement === null;
  const positive = improvement > 0;
  const color = noData ? "#4B5563" : positive ? "#10B981" : improvement === 0 ? "#6B7280" : "#EF4444";
  const label = noData ? "—" : `${positive ? "+" : ""}${improvement.toFixed(1)}`;

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 flex flex-col items-center justify-center gap-1">
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {label}<span className="text-(--subtle) text-sm">{noData ? "" : " pts"}</span>
      </p>
      <p className="text-[11px] text-(--muted) uppercase tracking-widest text-center">Improvement</p>
      <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: color }} />
    </div>
  );
}

// ── Score Pill ──────────────────────────────────────────────────────────────
function ScorePill({ score }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#EAB308" : score >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
    >
      {Math.round(score)}
    </div>
  );
}

// ── Score Trend Arrow ───────────────────────────────────────────────────────
function ScoreTrend({ sessions, index }) {
  // sessions is newest-first; compare to next item (which is older)
  if (index === sessions.length - 1) return <span className="text-[11px] text-(--subtle)">first</span>;
  const diff = sessions[index].score - sessions[index + 1].score;
  if (Math.abs(diff) < 0.5) return <span className="text-[11px] text-(--muted)">—</span>;
  return (
    <span className={`text-[12px] font-mono ${diff > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}
    </span>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatScenario(id) {
  return (id ?? "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(ts) {
  if (!ts) return "";
  // Firestore timestamps come as {_seconds, _nanoseconds} or ISO string
  const date = ts._seconds
    ? new Date(ts._seconds * 1000)
    : new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-(--bg) flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#EAB308]/20 border-t-[#EAB308] animate-spin" />
        <p className="text-(--muted) text-sm">Loading progress…</p>
      </div>
    </div>
  );
}
