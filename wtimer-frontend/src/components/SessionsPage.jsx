import { useMemo } from 'react';
import { EVENT_LABELS } from '../constants/events.js';
import { formatTime } from '../utils/format.js';

// Full solve history of the active session — every field the app records,
// including the scramble each solve was done with. Rows are newest-first and
// the DNF / +2 / delete actions work exactly like on the timer's side panel.
export default function SessionsPage({
  sessions,
  activeSessionId,
  onToggleDnf,
  onAddPenalty,
  onRemove,
}) {
  const active = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  // (solve, array index) pairs, newest first so it reads like the side panel.
  const rows = useMemo(() => {
    if (!active) return [];
    return active.solves.map((solve, index) => ({ solve, index })).reverse();
  }, [active]);

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <div className="sessions-heading">
          <h1 className="sessions-title">Sessions</h1>
          {active && (
            <span className="sessions-subtitle">
              {active.name} · {active.solves.length}{' '}
              {active.solves.length === 1 ? 'solve' : 'solves'}
            </span>
          )}
        </div>
      </div>

      {!active || active.solves.length === 0 ? (
        <div className="stats-empty">
          <i className="bx bx-cube-alt"></i>
          <p>
            No solves in this session yet.
            <br />
            Go back to the timer and complete a solve — it will show up here,
            scramble included.
          </p>
        </div>
      ) : (
        <div className="sessions-scroll">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>Event</th>
                <th>Scramble</th>
                <th>Date</th>
                <th className="sessions-actions-col"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ solve, index }) => {
                const num = active.solves.length - index;
                const isDnf = !!solve.dnf;
                const numPenalties = solve.penalties || 0;
                const label = EVENT_LABELS[solve.event] || solve.event;
                return (
                  <tr key={`${solve.date}-${index}`}>
                    <td className="sessions-num">{num}</td>
                    <td className={`sessions-time${isDnf ? ' dnf' : ''}`}>
                      {isDnf ? 'DNF' : formatTime(solve.time)}
                      {numPenalties > 0 && (
                        <span className="solve-penalty">+{numPenalties * 2}</span>
                      )}
                    </td>
                    <td className="sessions-event">{label}</td>
                    <td className="sessions-scramble" title={solve.scramble}>
                      {solve.scramble || '—'}
                    </td>
                    <td className="sessions-date">
                      {solve.date ? new Date(solve.date).toLocaleString() : '—'}
                    </td>
                    <td className="sessions-actions">
                      <button
                        type="button"
                        className={`solve-action dnf-action${isDnf ? ' active' : ''}`}
                        onClick={() => onToggleDnf(index)}
                        title={isDnf ? 'Undo DNF' : 'Mark as DNF'}
                        aria-label={isDnf ? 'Undo DNF' : 'Mark as DNF'}
                      >
                        {isDnf ? 'OK' : 'DNF'}
                      </button>
                      <button
                        type="button"
                        className="solve-action penalty-action"
                        onClick={() => onAddPenalty(index)}
                        title="Add +2 penalty"
                        aria-label="Add +2 penalty"
                      >
                        +2
                      </button>
                      <button
                        type="button"
                        className="solve-action remove-action"
                        onClick={() => onRemove(index)}
                        title="Remove solve"
                        aria-label="Remove solve"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}