const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export function getUserId() {
  const KEY = "icebreaker_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEY, id);
  }
  return id;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  getScenarios: () => request("GET", "/scenarios").then((d) => d.scenarios),

  getScenario: (id) => request("GET", `/scenarios/${id}`),

  getSystemPrompt: (scenarioId) =>
    request("GET", `/session-config?scenario_id=${scenarioId}`),

  startSession: ({ scenario_id, user_id }) =>
    request("POST", "/sessions/start", { scenario_id, user_id }),

  recordTurn: (sessionId, turnData) =>
    request("POST", `/sessions/${sessionId}/turn`, turnData),

  endSession: (sessionId, body = {}) =>
    request("POST", `/sessions/${sessionId}/end`, body),

  getReport: (sessionId) => request("GET", `/sessions/${sessionId}/report`),

  getProgress: (userId) => request("GET", `/users/${userId}/progress`),
};
