import { useEffect, useRef, useState } from "react";
import SessionModal from "./SessionModal.jsx";

// The "CFOP Practice ▼" switcher. Lives in the header (variant="header") so
// it reads like the event dropdown next to it; it doubles as the control on
// the Sessions page. Opens a menu of sessions (with rename/delete per row and
// "+ New Session" at the bottom) and routes create/rename/delete to the modal.
export default function SessionSelector({
  sessions,
  activeId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  variant = 'header',
}) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // {type, session?}
  const rootRef = useRef(null);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  // Close the menu when clicking/tapping outside it (same pattern as Dropdown).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  const openDialog = (next) => {
    setOpen(false);
    setDialog(next);
  };

  if (!active) return null;

  const barClass = [
    'session-bar',
    variant === 'header'
      ? 'session-bar--header'
      : variant === 'sidebar'
        ? 'session-bar--sidebar'
        : '',
    open ? 'open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div ref={rootRef} className={barClass}>
        <button
          type="button"
          className="session-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          title={active.name}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="session-trigger-name">{active.name}</span>
          <span className="session-trigger-count">
            {active.solves.length} {active.solves.length === 1 ? "solve" : "solves"}
          </span>
          <i className="bx bx-chevron-down session-trigger-chevron"></i>
        </button>

        {open && (
          <div className="session-menu" role="listbox" aria-label="Sessions">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`session-row${s.id === active.id ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="session-option"
                  role="option"
                  aria-selected={s.id === active.id}
                  onClick={() => {
                    onSwitch(s.id);
                    setOpen(false);
                  }}
                >
                  <span className="session-option-name">{s.name}</span>
                  <span className="session-option-count">{s.solves.length}</span>
                </button>
                <div className="session-row-actions">
                  <button
                    type="button"
                    className="session-row-action"
                    title="Rename"
                    aria-label={`Rename ${s.name}`}
                    onClick={() => openDialog({ type: "rename", session: s })}
                  >
                    <i className="bx bx-edit-alt"></i>
                  </button>
                  <button
                    type="button"
                    className="session-row-action danger"
                    title="Delete"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => openDialog({ type: "delete", session: s })}
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="session-new"
              onClick={() => openDialog({ type: "create" })}
            >
              <i className="bx bx-plus"></i>
              New Session
            </button>
          </div>
        )}
      </div>

      {dialog?.type === "create" && (
        <SessionModal
          title="New Session"
          confirmLabel="Create"
          body="Give this session a name — it starts empty."
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            onCreate(name);
            setDialog(null);
          }}
        />
      )}
      {dialog?.type === "rename" && (
        <SessionModal
          title={`Rename "${dialog.session.name}"`}
          confirmLabel="Rename"
          defaultValue={dialog.session.name}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            onRename(dialog.session.id, name);
            setDialog(null);
          }}
        />
      )}
      {dialog?.type === "delete" && (
        <SessionModal
          title={`Delete "${dialog.session.name}"?`}
          body={`This will permanently delete all ${dialog.session.solves.length} ${
            dialog.session.solves.length === 1 ? "solve" : "solves"
          } in this session.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onSubmit={() => {
            onDelete(dialog.session.id);
            setDialog(null);
          }}
        />
      )}
    </>
  );
}