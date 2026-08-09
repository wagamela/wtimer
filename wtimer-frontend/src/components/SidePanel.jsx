import { useMemo } from 'react';
import { EVENT_LABELS } from '../constants/events.js';
import { formatTime, calcAo, bestAo } from '../utils/format.js';
import { mean } from '../utils/stats.js';

export default function SidePanel({
  solves,
  currentEvent,
  onClear,
  onToggleDnf,
  onAddPenalty,
  onRemove,
}) {
  // Stats are computed per-event (same as the stats page). The recent
  // solves list below always shows solves from any event.
  const eventValid = useMemo(
    () => solves.filter((s) => s.event === currentEvent && !s.dnf),
    [solves, currentEvent],
  );

  const ao5 = calcAo(eventValid, 5);
  const ao12 = calcAo(eventValid, 12);
  const avgAll = mean(eventValid.map((s) => s.time));
  const bestTime = eventValid.length > 0 ? Math.min(...eventValid.map((s) => s.time)) : null;
  const ao5Pb = bestAo(eventValid, 5);
  const ao12Pb = bestAo(eventValid, 12);

  const fmt = (v) => (v !== null ? formatTime(v) : '—');
  const eventLabel = EVENT_LABELS[currentEvent] || currentEvent;

  // Always render 10 rows, newest at top, oldest at the bottom. Missing
  // ones fall back to placeholders.
  const rows = Array.from({ length: 10 }, (_, i) => {
    const idx = solves.length - 1 - i;
    return idx >= 0 ? { kind: 'solve', solve: solves[idx], num: idx + 1 } : { kind: 'empty' };
  });

  return (
    <div className="side-panel">
      <div className="panel-averages">
        <div className="avg-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="avg-label">AO5</span>
          <span className="avg-value">{fmt(ao5)}</span>
          <span className="avg-hint">Average of last 5 solves</span>
        </div>
        <div className="avg-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="avg-label">AO12</span>
          <span className="avg-value">{fmt(ao12)}</span>
          <span className="avg-hint">Average of last 12 solves</span>
        </div>
      </div>

      <div className="panel-averages compact">
        <div className="mini-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="mini-label">Average</span>
          <span className="mini-value">{fmt(avgAll)}</span>
        </div>
        <div className="mini-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="mini-label">PB</span>
          <span className={`mini-value${bestTime !== null ? ' pb' : ''}`}>{fmt(bestTime)}</span>
        </div>
        <div className="mini-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="mini-label">AO5 PB</span>
          <span className={`mini-value${ao5Pb !== null ? ' pb' : ''}`}>{fmt(ao5Pb)}</span>
        </div>
        <div className="mini-card">
          <span className="stat-event-tag">{eventLabel}</span>
          <span className="mini-label">AO12 PB</span>
          <span className={`mini-value${ao12Pb !== null ? ' pb' : ''}`}>{fmt(ao12Pb)}</span>
        </div>
      </div>

      <div className="panel-divider"></div>

      <div className="panel-list-header">
        <span>Recent Solves</span>
        <button className="clear-btn" onClick={onClear} title="Clear all">
          <i className="bx bx-trash"></i>
        </button>
      </div>

      <ul className="solve-list">
        {rows.map((row, i) => {
          if (row.kind === 'empty') {
            return (
              <li key={`empty-${i}`} className="solve-item solve-placeholder">
                <span className="solve-num">—</span>
                <span className="solve-event-empty"></span>
                <span className="solve-time-empty">—</span>
              </li>
            );
          }

          const { solve, num } = row;
          const isDnf = !!solve.dnf;
          const isBest = !isDnf && solve.time === bestTime;
          const label = EVENT_LABELS[solve.event] || solve.event;
          const numPenalties = solve.penalties || 0;

          return (
            <li
              key={`solve-${num}`}
              className={`solve-item${isBest ? ' best' : ''}${isDnf ? ' dnf' : ''}`}
            >
              <span className="solve-num">{num}</span>
              <span className="solve-event">{label}</span>
              <span className={`solve-time${isDnf ? ' solve-dnf' : ''}`}>
                {isDnf ? 'DNF' : formatTime(solve.time)}
                {numPenalties > 0 && <span className="solve-penalty">+{numPenalties * 2}</span>}
              </span>
              <button
                type="button"
                className={`solve-action dnf-action${isDnf ? ' active' : ''}`}
                onClick={() => onToggleDnf(num - 1)}
                title={isDnf ? 'Undo DNF' : 'Mark as DNF'}
                aria-label={isDnf ? 'Undo DNF' : 'Mark as DNF'}
              >
                {isDnf ? 'OK' : 'DNF'}
              </button>
              <button
                type="button"
                className="solve-action penalty-action"
                onClick={() => onAddPenalty(num - 1)}
                title="Add +2 penalty"
                aria-label="Add +2 penalty"
              >
                +2
              </button>
              <button
                type="button"
                className="solve-action remove-action"
                onClick={() => onRemove(num - 1)}
                title="Remove solve"
                aria-label="Remove solve"
              >
                <i className="bx bx-trash"></i>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}