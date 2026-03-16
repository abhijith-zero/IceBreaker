import { useState } from "react";
import { ScenarioCard } from "../components/ScenarioCard";
import { api, getUserId } from "../lib/api";

/**
 * ScenarioSelect — Screen 1
 * Shows 5 scenario cards. On click:
 *   1. GET /session-config (system prompt)
 *   2. POST /sessions/start
 *   → calls onSessionStart({ scenario, systemPrompt, sessionId, userId })
 */
export function ScenarioSelect({ scenarios, onSessionStart, onViewProgress }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  async function handleSelect(scenario) {
    if (loadingId) return;
    setLoadingId(scenario.id);
    setError(null);

    try {
      const userId = getUserId();

      const [configRes, sessionRes] = await Promise.all([
        api.getSystemPrompt(scenario.id),
        api.startSession({ scenario_id: scenario.id, user_id: userId }),
      ]);

      onSessionStart({
        scenario,
        systemPrompt: configRes.system_prompt,
        sessionId: sessionRes.session_id,
        userId,
      });
    } catch (err) {
      setError("Couldn't start session. Is the backend running?");
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-6 py-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#4ECDC4] to-[#2B6CB0] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3.5" fill="white" />
                <path
                  d="M9 1v2.5M9 14.5V17M1 9h2.5M14.5 9H17"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#4ECDC4]">
              Icebreaker
            </span>
          </div>

          {/* Progress link */}
          <button
            onClick={onViewProgress}
            className="text-[13px] text-[#6B7280] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>📈</span> View Progress
          </button>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Choose your scenario
        </h1>
        <p className="text-[#6B7280] text-lg max-w-lg">
          Practice real conversations with an AI persona. Live coaching helps
          you improve with every session.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-5xl mx-auto mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Scenario grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, i) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isLoading={loadingId === scenario.id}
            isDisabled={!!loadingId && loadingId !== scenario.id}
            animationDelay={i * 75}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <p className="text-center text-[#374151] text-xs mt-12">
        Sessions are private · Progress saves automatically
      </p>
    </div>
  );
}
