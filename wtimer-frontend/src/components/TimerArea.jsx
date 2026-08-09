import { useEffect, useRef, useState } from "react";
import { useScramble } from "../hooks/useScramble.js";
import { useTimer } from "../hooks/useTimer.js";
import CubeVisual from "./CubeVisual.jsx";

export default function TimerArea({
  currentEvent,
  solves,
  onSolveComplete,
  customScramble,
}) {
  const { scramble, loading, canPrev, next, prev, setCustom } =
    useScramble(currentEvent);
  const [delta, setDelta] = useState(null); // { text, positive }
  const [deltaVisible, setDeltaVisible] = useState(false);
  const deltaTimeoutRef = useRef(null);

  function handleComplete(elapsedMs) {
    if (solves.length > 0) {
      const lastTime = solves[solves.length - 1].time;
      const diffSec = (elapsedMs - lastTime) / 1000;
      const sign = diffSec > 0 ? "+" : "";
      setDelta({ text: sign + diffSec.toFixed(2), positive: diffSec <= 0 });

      clearTimeout(deltaTimeoutRef.current);
      setDeltaVisible(false);
      // double rAF to force a re-render before adding the fade-in class,
      // same trick as the original showDelta()
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setDeltaVisible(true)),
      );
      deltaTimeoutRef.current = setTimeout(() => setDeltaVisible(false), 4000);
    } else {
      setDeltaVisible(false);
    }

    onSolveComplete(elapsedMs, scramble);
    // A freshly generated scramble is offered after each solve, unless the
    // user is managing the scramble manually.
    if (!customScramble) next(true);
  }

  const { seconds, centis, phase } = useTimer(handleComplete);

  // Hide the delta badge as soon as a new hold begins, like the original.
  useEffect(() => {
    if (phase === "holding") {
      clearTimeout(deltaTimeoutRef.current);
      setDeltaVisible(false);
    }
  }, [phase]);

  const timerTextClass = [
    "timer-text",
    phase === "holding" ? "holding" : "",
    phase === "ready" ? "ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="timer-area">
      <div className="scramble-wrap">
        {customScramble ? (
          <input
            type="text"
            className="scramble scramble-editable"
            value={scramble}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Enter your own scramble…"
            spellCheck={false}
          />
        ) : (
          <div className="scramble-row">
            <button
              type="button"
              className="scramble-nav"
              onClick={prev}
              disabled={!canPrev}
              title="Previous scramble"
              aria-label="Previous scramble"
            >
              <i className="bx bx-chevron-left"></i>
            </button>
            <p className={`scramble${loading ? " loading" : ""}`}>{scramble}</p>
            <button
              type="button"
              className="scramble-nav"
              onClick={next}
              disabled={loading}
              title="Next scramble"
              aria-label="Next scramble"
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
      <div className="timer-display">
        <div className={timerTextClass}>
          <span>{seconds}</span>
          <span className="sep">.</span>
          <span>{centis}</span>
          {delta && (
            <span
              className={`delta-badge ${delta.positive ? "positive" : "negative"}${
                deltaVisible ? " visible" : ""
              }`}
            >
              {delta.text}
            </span>
          )}
        </div>
      </div>
      {/* Cube scramble visual disabled for now. Re-enable with:
          <CubeVisual event={currentEvent} scramble={scramble} />
      */}
    </div>
  );
}
