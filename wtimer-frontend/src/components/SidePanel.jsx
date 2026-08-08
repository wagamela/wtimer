import { EVENT_LABELS } from '../constants/events.js';
import { formatTime, calcAo } from '../utils/format.js';

export default function SidePanel({ solves, onClear }) {
  const ao5 = calcAo(solves, 5);
  const ao12 = calcAo(solves, 12);
  const bestTime = solves.length > 0 ? Math.min(...solves.map((s) => s.time)) : null;

  // Always render 10 rows (oldest at top, newest at bottom), padding
  // missing ones with placeholders — matches the original renderPanel().
  const last10 = solves.slice(-10);

  return (
    <div className="side-panel">
      <div className="panel-averages">
        <div className="avg-card">
          <span className="avg-label">AO5</span>
          <span className="avg-value">{ao5 !== null ? formatTime(ao5) : '—'}</span>
          <span className="avg-hint">Average of last 5 solves</span>
        </div>
        <div className="avg-card">
          <span className="avg-label">AO12</span>
          <span className="avg-value">{ao12 !== null ? formatTime(ao12) : '—'}</span>
          <span className="avg-hint">Average of last 12 solves</span>
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
        {Array.from({ length: 10 }, (_, i) => {
          const row = i + 1;
          const solve = last10[i] ?? null;

          if (!solve) {
            return (
              <li key={row} className="solve-item solve-placeholder">
                <span className="solve-num">{row}</span>
                <span className="solve-event-empty"></span>
                <span className="solve-time-empty">—</span>
              </li>
            );
          }

          const isBest = solve.time === bestTime;
          const label = EVENT_LABELS[solve.event] || solve.event;
          return (
            <li key={row} className={`solve-item${isBest ? ' best' : ''}`}>
              <span className="solve-num">{row}</span>
              <span className="solve-event">{label}</span>
              <span className="solve-time">{formatTime(solve.time)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
