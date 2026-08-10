import { useMemo, useState } from 'react';
import { EVENT_LABELS } from '../constants/events.js';
import { formatTime } from '../utils/format.js';

// The full solve history of one session — every field the app records,
// including the scramble each solve was done with. Rows are newest-first and
// the DNF / +2 / delete actions work exactly like on the timer's side panel.
function SessionSolves({ session, onToggleDnf, onAddPenalty, onRemove }) {
  // (solve, array index) pairs, newest first so it reads like the side panel.
  const rows = useMemo(() => {
    return session.solves.map((solve, index) => ({ solve, index })).reverse();
  }, [session.solves]);

  if (session.solves.length === 0) {
    return (
      <div className="session-acc-empty">
        No solves in this session yet. Go back to the timer and complete a
        solve — it will show up here, scramble included.
      </div>
    );
  }

  return (
    <div className="session-acc-body">
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
            const num = session.solves.length - index;
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
                    onClick={() => onToggleDnf(session.id, index)}
                    title={isDnf ? 'Undo DNF' : 'Mark as DNF'}
                    aria-label={isDnf ? 'Undo DNF' : 'Mark as DNF'}
                  >
                    {isDnf ? 'OK' : 'DNF'}
                  </button>
                  <button
                    type="button"
                    className="solve-action penalty-action"
                    onClick={() => onAddPenalty(session.id, index)}
                    title="Add +2 penalty"
                    aria-label="Add +2 penalty"
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    className="solve-action remove-action"
                    onClick={() => onRemove(session.id, index)}
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
  );
}

// All sessions as an accordion: each header shows the session name and its
// solve count, and clicking it expands/collapses that session's solves. One
// session is open at a time; the most recently active one starts expanded.
export default function SessionsPage({
  sessions,
  activeSessionId,
  onToggleDnf,
  onAddPenalty,
  onRemove,
}) {
  const [expandedId, setExpandedId] = useState(
    () => sessions.find((s) => s.id === activeSessionId)?.id ?? sessions[0]?.id ?? null,
  );

  const toggle = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const totalSolves = useMemo(
    () => sessions.reduce((count, s) => count + s.solves.length, 0),
    [sessions],
  );

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <div className="sessions-heading">
          <h1 className="sessions-title">Sessions</h1>
          <span className="sessions-subtitle">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} ·{' '}
            {totalSolves} {totalSolves === 1 ? 'solve' : 'solves'}
          </span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="stats-empty">
          <i className="bx bx-cube-alt"></i>
          <p>No sessions yet.</p>
        </div>
      ) : (
        <div className="sessions-accordion">
          {sessions.map((session) => {
            const isExpanded = session.id === expandedId;
            const isActive = session.id === activeSessionId;
            return (
              <section
                key={session.id}
                className={`session-acc${isExpanded ? ' open' : ''}`}
              >
                <button
                  type="button"
                  className="session-acc-header"
                  aria-expanded={isExpanded}
                  onClick={() => toggle(session.id)}
                >
                  <span
                    className={`session-acc-name${isActive ? ' active' : ''}`}
                    title={session.name}
                  >
                    {session.name}
                  </span>
                  <span className="session-acc-count">
                    {session.solves.length}{' '}
                    {session.solves.length === 1 ? 'solve' : 'solves'}
                  </span>
                  <i className="bx bx-chevron-down session-acc-chevron"></i>
                </button>
                {isExpanded && (
                  <SessionSolves
                    session={session}
                    onToggleDnf={onToggleDnf}
                    onAddPenalty={onAddPenalty}
                    onRemove={onRemove}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}