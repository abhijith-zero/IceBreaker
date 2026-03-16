import { useState, useEffect } from "react";
import { api, getUserId } from "./lib/api";
import { ThemeProvider } from "./context/ThemeContext";

// Screens — created one by one below
import { ScenarioSelect } from "./screens/ScenarioSelect";
import { PracticeSession } from "./screens/PracticeSession";
import { Debrief } from "./screens/Debrief";
import { ProgressDashboard } from "./screens/ProgressDashboard";

export default function App() {
  const [screen, setScreen] = useState("select");
  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [scenariosError, setScenariosError] = useState(null);
  const [sessionCtx, setSessionCtx] = useState(null);
  const [debriefData, setDebriefData] = useState(null);

  useEffect(() => {
    api
      .getScenarios()
      .then(setScenarios)
      .catch(() =>
        setScenariosError("Could not load scenarios — is the backend running?"),
      )
      .finally(() => setScenariosLoading(false));
  }, []);

  function handleSessionStart(ctx) {
    setSessionCtx(ctx);
    setScreen("session");
  }

  function handleSessionEnd(debrief) {
    setDebriefData(debrief);
    setScreen("debrief");
  }

  function goHome() {
    setScreen("select");
    setSessionCtx(null);
    setDebriefData(null);
  }

  if (scenariosLoading) return <FullPageSpinner />;

  if (scenariosError)
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-(--bg) flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-red-400">{scenariosError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#EAB308] text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      </ThemeProvider>
    );

  return (
    <ThemeProvider>
      {screen === "select" && (
        <ScenarioSelect
          scenarios={scenarios}
          onSessionStart={handleSessionStart}
          onViewProgress={() => setScreen("progress")}
        />
      )}
      {screen === "session" && sessionCtx && (
        <PracticeSession
          context={sessionCtx}
          onSessionEnd={handleSessionEnd}
          onExit={goHome}
        />
      )}
      {screen === "debrief" && debriefData && (
        <Debrief
          debrief={debriefData}
          scenario={sessionCtx?.scenario}
          onHome={goHome}
          onViewProgress={() => setScreen("progress")}
        />
      )}
      {screen === "progress" && (
        <ProgressDashboard
          userId={sessionCtx?.userId ?? getUserId()}
          onHome={goHome}
        />
      )}
    </ThemeProvider>
  );
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-(--bg) flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#EAB308]/20 border-t-[#EAB308] animate-spin" />
        <p className="text-(--muted) text-sm">Loading scenarios…</p>
      </div>
    </div>
  );
}
