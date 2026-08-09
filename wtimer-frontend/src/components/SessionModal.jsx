import { useEffect, useRef, useState } from "react";

// One dialog for the whole session workflow: a name input for create/rename,
// or a confirmation with a message for delete. Esc or clicking the backdrop
// cancels; the confirm button — or Enter in the input — submits. Empty names
// can't be submitted (create/rename are disabled while the field is blank).
export default function SessionModal({
  title,
  body,
  confirmLabel,
  danger = false,
  defaultValue = "",
  onCancel,
  onSubmit,
}) {
  const [name, setName] = useState(defaultValue);
  const trimmed = name.trim();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!danger) inputRef.current?.focus();
  }, [danger]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-title">{title}</div>
        {body && <p className="modal-text">{body}</p>}
        {!danger && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (trimmed) onSubmit(trimmed);
            }}
          >
            <input
              ref={inputRef}
              className="modal-input"
              type="text"
              value={name}
              maxLength={64}
              spellCheck={false}
              placeholder="Session name"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setName(e.target.value)}
            />
          </form>
        )}
        <div className="modal-actions">
          <button type="button" className="modal-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`modal-btn ${danger ? "danger" : "primary"}`}
            disabled={!danger && !trimmed}
            onClick={() => (danger ? onSubmit() : onSubmit(trimmed))}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}