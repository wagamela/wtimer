import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EVENT_LABELS } from '../constants/events.js';
import { formatTime } from '../utils/format.js';
import { mean } from '../utils/stats.js';
import SessionModal from './SessionModal.jsx';

// Summary numbers for one session, computed for its accordion header. Average
// and best ignore DNF solves, matching the timer's side panel stats.
function sessionStats(session) {
  const times = session.solves.filter((s) => !s.dnf).map((s) => s.time);
  return {
    count: session.solves.length,
    avg: times.length ? mean(times) : null,
    best: times.length ? Math.min(...times) : null,
  };
}

// Compact, scannable date: "Aug 14, 10:32" (year included only when it's not
// the current one).
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const opts = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleString(undefined, opts);
}

function downloadSessionCsv(session) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['#', 'Time (s)', 'Event', 'Scramble', 'Date', 'DNF', '+2 penalties'].map(esc).join(','),
    ...session.solves.map((s, i) =>
      [
        i + 1,
        (s.time / 1000).toFixed(3),
        s.event || '',
        s.scramble || '',
        s.date ? new Date(s.date).toISOString() : '',
        s.dnf ? '1' : '0',
        s.penalties || 0,
      ].map(esc).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.name.replace(/[\\/:*?"<>|]/g, '_')}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Subtle per-session action menu. Rendered into <body> so the accordion's
// scroll container never clips it; flips upward when it would run off the
// bottom of the viewport. Rename / clear / delete reuse the same modal
// workflow as the header switcher's menu.
function SessionActionsMenu({ session, onRename, onClear, onDelete, onExport }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  // Close when clicking/tapping outside the trigger or the popup (same
  // outside-click pattern as Dropdown and SessionSelector).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      const inside =
        (rootRef.current && rootRef.current.contains(e.target)) ||
        (menuRef.current && menuRef.current.contains(e.target));
      if (!inside) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Close when the accordion scrolls or the window resizes, so the popup
  // never stays detached from its trigger.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // Anchor the popup to the trigger synchronously, before the browser paints.
  // Without this the first open of each menu would render one frame with no
  // position (below the viewport) and then jump — the flash / first-click
  // glitch. The popup is only rendered once `pos` is set, so it never mounts
  // in a wrong spot.
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const width = 200;
    const height = 150;
    const left = Math.min(rect.right - width, window.innerWidth - width - 8);
    const anchorLeft = Math.max(8, left);
    const opensUp = rect.bottom + height > window.innerHeight - 8;
    setPos(
      opensUp
        ? { top: 'auto', left: anchorLeft, bottom: window.innerHeight - rect.top + 6 }
        : { left: anchorLeft, top: rect.bottom + 6 },
    );
  }, [open]);

  const run = (fn) => {
    setOpen(false);
    fn();
  };

  const hasSolves = session.solves.length > 0;

  return (
    <>
      <div
        ref={rootRef}
        className="session-acc-menu"
        onKeyDown={(e) => {
          if (!open && ['ArrowDown', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <button
          type="button"
          className="session-acc-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Actions for ${session.name}`}
          title="Session actions"
          onClick={() => setOpen((o) => !o)}
        >
          <i className="bx bx-dots-vertical-rounded"></i>
        </button>
      </div>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu session-acc-menu-pop"
            role="menu"
            style={pos}
            aria-label={`Actions for ${session.name}`}
          >
            <button
              type="button"
              role="menuitem"
              className="dropdown-option"
              autoFocus
              onClick={() => run(onRename)}
            >
              <span className="dropdown-option-label">Rename</span>
              <i className="bx bx-edit-alt"></i>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-option"
              onClick={() => run(onExport)}
            >
              <span className="dropdown-option-label">Export CSV</span>
              <i className="bx bx-download"></i>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-option"
              disabled={!hasSolves}
              onClick={() => run(onClear)}
            >
              <span className="dropdown-option-label">Clear solves</span>
              <i className="bx bx-trash"></i>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-option danger"
              onClick={() => run(onDelete)}
            >
              <span className="dropdown-option-label">Delete session</span>
              <i className="bx bx-trash"></i>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

// The full solve history of one session — every field the app records,
// including the scramble each solve was done with. Rows are newest-first and
// the DNF / +2 / delete actions work exactly like on the timer's side panel.
function SessionSolves({ session, onToggleDnf, onAddPenalty, onRemove }) {
  // (solve, array index) pairs, newest first so it reads like the side panel.
  const rows = useMemo(() => {
    return session.solves.map((solve, index) => ({ solve, index })).reverse();
  }, [session.solves]);

  const bestTime = useMemo(() => {
    const times = session.solves.filter((s) => !s.dnf).map((s) => s.time);
    return times.length ? Math.min(...times) : null;
  }, [session.solves]);

  if (session.solves.length === 0) {
    return (
      <div className="session-acc-empty">
        <i className="bx bx-timer"></i>
        <p>
          No solves in this session yet. Go back to the timer and complete a
          solve — it will show up here, scramble included.
        </p>
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
            <th className="sessions-actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ solve, index }) => {
            const num = session.solves.length - index;
            const isDnf = !!solve.dnf;
            const numPenalties = solve.penalties || 0;
            const isBest = !isDnf && solve.time === bestTime;
            const label = EVENT_LABELS[solve.event] || solve.event;
            return (
              <tr
                key={`${solve.date}-${index}`}
                className={`sessions-row${isBest ? ' best' : ''}${isDnf ? ' dnf' : ''}`}
              >
                <td className="sessions-num">{num}</td>
                <td className="sessions-time">
                  {isDnf ? 'DNF' : formatTime(solve.time)}
                  {numPenalties > 0 && (
                    <span className="solve-penalty">+{numPenalties * 2}</span>
                  )}
                  {isBest && <span className="solve-pb">PB</span>}
                </td>
                <td className="sessions-event">{label}</td>
                <td className="sessions-scramble" title={solve.scramble}>
                  {solve.scramble || '—'}
                </td>
                <td className="sessions-date">{formatDate(solve.date)}</td>
                <td>
                  <div className="sessions-actions">
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
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// All sessions as an accordion: each header shows the session name and a
// compact stat line (solves / average / best) so the page reads even when
// collapsed, plus an action menu for rename / export / clear / delete.
// Clicking the header expands/collapses that session's solves. One session is
// open at a time; the most recently active one starts expanded.
export default function SessionsPage({
  sessions,
  activeSessionId,
  onToggleDnf,
  onAddPenalty,
  onRemove,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onClearSession,
}) {
  const [expandedId, setExpandedId] = useState(
    () => sessions.find((s) => s.id === activeSessionId)?.id ?? sessions[0]?.id ?? null,
  );
  const [dialog, setDialog] = useState(null); // {type: 'create'|'rename'|'clear'|'delete', session?}

  // Keep the open section valid: if the expanded session disappears (deleted
  // or data reset), fall back to the first session.
  useEffect(() => {
    setExpandedId((current) =>
      sessions.some((s) => s.id === current) ? current : sessions[0]?.id ?? null,
    );
  }, [sessions]);

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
        <button
          type="button"
          className="sessions-new-btn"
          onClick={() => setDialog({ type: 'create' })}
        >
          <i className="bx bx-plus"></i> New Session
        </button>
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
            const stats = sessionStats(session);
            return (
              <section
                key={session.id}
                className={`session-acc${isExpanded ? ' open' : ''}`}
              >
                <div className="session-acc-header">
                  <button
                    type="button"
                    className="session-acc-toggle"
                    aria-expanded={isExpanded}
                    onClick={() => toggle(session.id)}
                  >
                    <span
                      className={`session-acc-name${isActive ? ' active' : ''}`}
                      title={session.name}
                    >
                      {session.name}
                    </span>
                    <span className="session-acc-stats">
                      <span className="session-acc-stat solves">
                        <span className="session-acc-stat-label">Solves</span>
                        <span className="session-acc-stat-value">{stats.count}</span>
                      </span>
                      <span className="session-acc-stat avg">
                        <span className="session-acc-stat-label">Avg</span>
                        <span className="session-acc-stat-value">
                          {stats.avg !== null ? formatTime(stats.avg) : '—'}
                        </span>
                      </span>
                      <span className="session-acc-stat best">
                        <span className="session-acc-stat-label">Best</span>
                        <span className="session-acc-stat-value">
                          {stats.best !== null ? formatTime(stats.best) : '—'}
                        </span>
                      </span>
                    </span>
                    <i className="bx bx-chevron-down session-acc-chevron"></i>
                  </button>
                  <SessionActionsMenu
                    session={session}
                    onRename={() => setDialog({ type: 'rename', session })}
                    onClear={() => setDialog({ type: 'clear', session })}
                    onDelete={() => setDialog({ type: 'delete', session })}
                    onExport={() => downloadSessionCsv(session)}
                  />
                </div>
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

      {dialog?.type === 'create' && (
        <SessionModal
          title="New Session"
          confirmLabel="Create"
          body="Give this session a name — it starts empty."
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            const created = onCreateSession(name);
            if (created) setExpandedId(created.id);
            setDialog(null);
          }}
        />
      )}
      {dialog?.type === 'rename' && (
        <SessionModal
          title={`Rename "${dialog.session.name}"`}
          confirmLabel="Rename"
          defaultValue={dialog.session.name}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            onRenameSession(dialog.session.id, name);
            setDialog(null);
          }}
        />
      )}
      {dialog?.type === 'clear' && (
        <SessionModal
          title={`Clear "${dialog.session.name}"?`}
          body={`This will permanently delete all ${dialog.session.solves.length} ${
            dialog.session.solves.length === 1 ? 'solve' : 'solves'
          } in this session.`}
          confirmLabel="Clear"
          danger
          onCancel={() => setDialog(null)}
          onSubmit={() => {
            onClearSession(dialog.session.id);
            setDialog(null);
          }}
        />
      )}
      {dialog?.type === 'delete' && (
        <SessionModal
          title={`Delete "${dialog.session.name}"?`}
          body={`This will permanently delete all ${dialog.session.solves.length} ${
            dialog.session.solves.length === 1 ? 'solve' : 'solves'
          } in this session.`}
          confirmLabel="Delete"
          danger
          tone="danger-dark"
          onCancel={() => setDialog(null)}
          onSubmit={() => {
            onDeleteSession(dialog.session.id);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
