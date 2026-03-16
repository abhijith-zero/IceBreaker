import { useState } from "react";
import { ScenarioCard } from "../components/ScenarioCard";
import { api, getUserId } from "../lib/api";
import { IcebreakerLogo } from "../components/IcebreakerLogo";
import { ThemeToggle } from "../components/ThemeToggle";

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
        voice: configRes.voice ?? "Puck",
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
    <div className="min-h-screen bg-(--bg) px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-8">
          {/* Logo */}
          <div>
            <IcebreakerLogo size="lg" />
          </div>

          {/* Progress link + theme toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onViewProgress}
              className="text-[13px] text-(--muted) hover:text-(--fg) transition-colors flex items-center gap-1.5"
            >
              <span>📈</span> View Progress
            </button>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Choose your scenario
        </h1>
        <p className="text-(--muted) text-lg max-w-lg">
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

      <p className="text-center text-(--subtle) text-xs mt-12">
        Sessions are private · Progress saves automatically
      </p>
    </div>
  );
}
