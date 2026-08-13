import { useCallback, useEffect, useState } from "react";
import { createSession, loadSessions, saveSessions } from "./sessionStore.js";

// Owns the session list and the single active session, provides the session
// CRUD + solve operations, and keeps localStorage in sync. The rest of the
// app derives "which session am I solving in" and its solve list from here.
export function useSessions() {
  const [store, setStore] = useState(loadSessions);

  useEffect(() => {
    saveSessions(store.sessions, store.activeId);
  }, [store]);

  const activeSession =
    store.sessions.find((s) => s.id === store.activeId) ??
    store.sessions[0] ??
    null;

  const switchSession = useCallback((id) => {
    setStore((prev) =>
      prev.sessions.some((s) => s.id === id) ? { ...prev, activeId: id } : prev,
    );
  }, []);

  const createNamedSession = useCallback((name) => {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) return null;
    const session = createSession(trimmed);
    setStore((prev) => ({
      sessions: [...prev.sessions, session],
      activeId: session.id,
    }));
    return session;
  }, []);

  const renameSession = useCallback((id, name) => {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) return;
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === id ? { ...s, name: trimmed, updatedAt: Date.now() } : s,
      ),
    }));
  }, []);

  // Deleting the active session auto-switches to another; deleting the last
  // session immediately creates a fresh default so one is always active.
  const deleteSession = useCallback((id) => {
    setStore((prev) => {
      const remaining = prev.sessions.filter((s) => s.id !== id);
      if (remaining.length === prev.sessions.length) return prev;
      if (prev.activeId !== id) return { ...prev, sessions: remaining };
      if (remaining.length === 0) {
        const fresh = [createSession("Session 1")];
        return { sessions: fresh, activeId: fresh[0].id };
      }
      return { sessions: remaining, activeId: remaining[0].id };
    });
  }, []);

  // All solve mutations below key into a given session's solve list, using the
  // same index-into-array convention the original App state used. The active
  // session is resolved by the caller (the timer UI only ever edits the active
  // session, but the Sessions page edits whichever session is expanded).
  const addSolve = useCallback((solve) => {
    const now = Date.now();
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === prev.activeId
          ? { ...s, solves: [...s.solves, solve], updatedAt: now }
          : s,
      ),
    }));
  }, []);

  const toggleDnf = useCallback((sessionId, index) => {
    const now = Date.now();
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              solves: s.solves.map((slv, i) =>
                i === index ? { ...slv, dnf: !slv.dnf } : slv,
              ),
              updatedAt: now,
            }
          : s,
      ),
    }));
  }, []);

  const addPenalty = useCallback((sessionId, index) => {
    const now = Date.now();
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              solves: s.solves.map((slv, i) =>
                i === index
                  ? {
                      ...slv,
                      time: slv.time + 2000,
                      penalties: (slv.penalties || 0) + 1,
                    }
                  : slv,
              ),
              updatedAt: now,
            }
          : s,
      ),
    }));
  }, []);

  const removeSolve = useCallback((sessionId, index) => {
    const now = Date.now();
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              solves: s.solves.filter((_, i) => i !== index),
              updatedAt: now,
            }
          : s,
      ),
    }));
  }, []);

  const clearActiveSessionSolves = useCallback(() => {
    const now = Date.now();
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === prev.activeId
          ? { ...s, solves: [], updatedAt: now }
          : s,
      ),
    }));
  }, []);

  // Nukes every session and solves, leaving a single fresh default session.
  const clearAllData = useCallback(() => {
    const fresh = [createSession("Session 1")];
    setStore({ sessions: fresh, activeId: fresh[0].id });
  }, []);

  return {
    sessions: store.sessions,
    activeId: store.activeId,
    activeSession,
    switchSession,
    createSession: createNamedSession,
    renameSession,
    deleteSession,
    addSolve,
    toggleDnf,
    addPenalty,
    removeSolve,
    clearSession: clearActiveSessionSolves,
    clearAllData,
  };
}