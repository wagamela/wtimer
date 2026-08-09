// Session model + persistence.
//
// The app's solves used to live only in App state and were lost on reload, so
// there was no existing persistence layer to extend. This module adds a
// localStorage-backed store where each named session owns its own solve list.
// Loading normalizes whatever is stored: corrupt JSON, stray flat solve lists
// (hypothetical pre-session format), duplicate ids and a missing/invalid
// active session are all handled instead of crashing the timer.

export const SESSIONS_KEY = "wtimer.sessions.v1";
export const ACTIVE_KEY = "wtimer.activeSessionId";
const LEGACY_SOLVES_KEY = "wtimer.solves";

export function makeId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

// Session shape: { id, name, createdAt, updatedAt, solves }
export function createSession(name) {
  const now = Date.now();
  return {
    id: makeId(),
    name: typeof name === "string" ? name.trim() : "",
    createdAt: now,
    updatedAt: now,
    solves: [],
  };
}

// A solve just needs an object with a finite time. Extra fields the app may
// have recorded (event, date, scramble, dnf, penalties) are preserved as-is.
export function isValidSolve(s) {
  return (
    !!s &&
    typeof s === "object" &&
    !Array.isArray(s) &&
    Number.isFinite(s.time)
  );
}

// Rebuild a clean, usable session list out of whatever was in storage.
// Keeps solve data, drops outright invalid entries, and quietly repairs
// missing names / colliding ids.
export function sanitizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const sessions = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    let id = typeof item.id === "string" && item.id ? item.id : makeId();
    if (seen.has(id)) id = makeId();
    seen.add(id);
    const solves = Array.isArray(item.solves)
      ? item.solves.filter(isValidSolve)
      : [];
    sessions.push({
      id,
      name:
        typeof item.name === "string" && item.name.trim()
          ? item.name.trim()
          : `Session ${sessions.length + 1}`,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      solves,
    });
  }
  return sessions;
}

// The app was never persisted, so there's no real legacy format to carry
// over — but if a stray flat solve list shows up under the legacy key it's
// folded into "Session 1" instead of being discarded. The key is removed once
// it migrates, so re-running (e.g. the dev StrictMode double-render) never
// duplicates solves.
function migrateLegacySolves(sessions) {
  const raw = localStorage.getItem(LEGACY_SOLVES_KEY);
  if (raw == null) return sessions;
  let legacy = null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) legacy = parsed.filter(isValidSolve);
  } catch {
    localStorage.removeItem(LEGACY_SOLVES_KEY);
    return sessions;
  }
  if (!legacy || legacy.length === 0) {
    localStorage.removeItem(LEGACY_SOLVES_KEY);
    return sessions;
  }
  const migrated = createSession("Session 1");
  migrated.solves = legacy;
  localStorage.removeItem(LEGACY_SOLVES_KEY);
  return [...sessions, migrated];
}

function ensureDefaultSession(sessions) {
  return sessions.length > 0 ? sessions : [createSession("Session 1")];
}

// Read + normalize + persist back. Always returns a valid active id; never
// leaves the app without a session. Idempotent, safe to call on every mount.
export function loadSessions() {
  try {
    let sessions = [];
    const raw = localStorage.getItem(SESSIONS_KEY);
    sessions = sanitizeSessions(raw ? JSON.parse(raw) : null);
    sessions = migrateLegacySolves(sessions);
    sessions = ensureDefaultSession(sessions);

    let activeId = localStorage.getItem(ACTIVE_KEY);
    if (!sessions.some((s) => s.id === activeId)) activeId = sessions[0].id;

    saveSessions(sessions, activeId);
    return { sessions, activeId };
  } catch {
    // Storage entirely unavailable — fall back to a single in-memory session.
    const fallback = [createSession("Session 1")];
    return { sessions: fallback, activeId: fallback[0].id };
  }
}

export function saveSessions(sessions, activeId) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  } catch {
    // Quota exceeded or storage disabled — the timer keeps working in memory.
  }
}