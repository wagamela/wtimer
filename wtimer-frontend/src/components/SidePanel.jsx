import { useMemo, useState } from 'react';
import { formatTime, calcAo, bestAo } from '../utils/format.js';
import { mean } from '../utils/stats.js';
import SessionSelector from './SessionSelector.jsx';
import SessionModal from './SessionModal.jsx';

export default function SidePanel({
  solves,
  currentEvent,
  sessions,
  activeId,
  onClear,
  onToggleDnf,
  onAddPenalty,
  onRemove,
  onSwitchSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
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

  // Custom confirmation for clearing the whole session's solves. Deleting a
  // single solve (onRemove) stays instant — this only guards the bulk clear.
  const [confirmClear, setConfirmClear] = useState(false);
  const activeSessionName =
    sessions.find((s) => s.id === activeId)?.name ?? 'current session';

  // Newest at the top, oldest at the bottom.
  const rows = solves
    .map((solve, index) => ({ solve, num: index + 1 }))
    .reverse();

  return (
    <div className="side-panel">
      <section className="side-section side-session">
        <SessionSelector
          variant="sidebar"
          sessions={sessions}
          activeId={activeId}
          onSwitch={onSwitchSession}
          onCreate={onCreateSession}
          onRename={onRenameSession}
          onDelete={onDeleteSession}
        />
      </section>

      <section className="side-section side-stats">
        <div className="side-section-head">
          <span className="side-section-label">Statistics</span>
        </div>

        <div className="stat-grid">
          <div className="stat-cell">
            <span className="stat-cell-label">Ao5</span>
            <span className="stat-cell-value">{fmt(ao5)}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-cell-label">Ao12</span>
            <span className="stat-cell-value">{fmt(ao12)}</span>
          </div>
          <div className="stat-cell stat-cell-primary">
            <span className="stat-cell-label">Average</span>
            <span className="stat-cell-value">{fmt(avgAll)}</span>
          </div>
          <div className="stat-cell stat-cell-primary">
            <span className="stat-cell-label">PB</span>
            <span className={`stat-cell-value${bestTime !== null ? ' pb' : ''}`}>
              {fmt(bestTime)}
            </span>
          </div>
        </div>

        <div className="stat-sublist">
          <div className="stat-sub-row">
            <span className="stat-sub-label">Ao5 PB</span>
            <span className={`stat-sub-value${ao5Pb !== null ? ' pb' : ''}`}>{fmt(ao5Pb)}</span>
          </div>
          <div className="stat-sub-row">
            <span className="stat-sub-label">Ao12 PB</span>
            <span className={`stat-sub-value${ao12Pb !== null ? ' pb' : ''}`}>{fmt(ao12Pb)}</span>
          </div>
        </div>
      </section>

      <section className="side-section side-solves">
        <div className="side-section-head">
          <span className="side-section-label">Solves</span>
          <button className="clear-btn" onClick={() => setConfirmClear(true)} title="Clear session">
            <i className="bx bx-trash"></i>
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="solve-empty">No solves yet</div>
        ) : (
          <ul className="solve-list">
            {rows.map(({ solve, num }) => {
              const isDnf = !!solve.dnf;
              const isBest = !isDnf && solve.time === bestTime;

              return (
                <li
                  key={`solve-${num}`}
                  className={`solve-item${isBest ? ' best' : ''}${isDnf ? ' dnf' : ''}`}
                >
                  <span className="solve-num">{num}</span>
                  <span className={`solve-time${isDnf ? ' solve-dnf' : ''}`}>
                    {isDnf ? 'DNF' : formatTime(solve.time)}
                    {isBest && <span className="solve-pb">PB</span>}
                  </span>
                  <span className="solve-actions">
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
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {confirmClear && (
        <SessionModal
          title={`Clear "${activeSessionName}"?`}
          body={`This will permanently delete all ${solves.length} ${
            solves.length === 1 ? 'solve' : 'solves'
          } in this session.`}
          confirmLabel="Clear"
          danger
          onCancel={() => setConfirmClear(false)}
          onSubmit={() => {
            onClear();
            setConfirmClear(false);
          }}
        />
      )}
    </div>
  );
}