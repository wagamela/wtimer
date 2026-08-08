import { useState, useEffect, useCallback } from 'react';
import { randomScrambleForEvent } from 'cubing/scramble';

// Generates scrambles for the given WCA event and keeps a navigation
// history so the timer can move between previous and next scrambles.
// `setCustom` lets the caller replace the currently shown scramble with a
// manually typed one (used by the "Custom scramble" setting).
export function useScramble(event) {
  const [entries, setEntries] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(true);

  // Start fresh whenever the event changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let s;
      try {
        s = (await randomScrambleForEvent(event)).toString();
      } catch {
        s = 'Could not generate scramble.';
      }
      if (cancelled) return;
      setEntries([{ scramble: s, generated: true }]);
      setCursor(0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [event]);

  // Move to the next scramble in the history. If a forward trail exists
  // (i.e. the user stepped back with `prev`), just move forward again instead
  // of generating a brand new scramble. Only when we're already on the newest
  // entry do we generate a fresh one. Pass `fresh` (e.g. after a solve) to
  // always generate a new scramble.
  const next = useCallback(
    async (fresh = false) => {
      if (!fresh && cursor < entries.length - 1) {
        setCursor((c) => c + 1);
        return;
      }
      setLoading(true);
      let s;
      try {
        s = (await randomScrambleForEvent(event)).toString();
      } catch {
        s = 'Could not generate scramble.';
      }
      setEntries((prev) => [...prev, { scramble: s, generated: true }]);
      setCursor((c) => c + 1);
      setLoading(false);
    },
    [event, cursor, entries.length],
  );

  // Walk back to a previously shown scramble.
  const prev = useCallback(() => {
    setCursor((c) => Math.max(0, c - 1));
  }, []);

  // Replace the currently shown scramble with custom text.
  const setCustom = useCallback((text) => {
    setEntries((prevEntries) =>
      prevEntries.map((e, i) =>
        i === cursor ? { ...e, scramble: text, generated: false } : e,
      ),
    );
  }, [cursor]);

  return {
    scramble: entries[cursor]?.scramble ?? '',
    loading,
    canPrev: cursor > 0,
    next,
    prev,
    setCustom,
  };
}