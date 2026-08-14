import { useEffect, useRef, useState } from "react";

// One dialog for the whole session workflow: a name input for create/rename,
// or a confirmation with a message for delete. Esc or clicking the backdrop
// cancels; the confirm button — or Enter in the input — submits. Empty names
// can't be submitted (create/rename are disabled while the field is blank).
//
// `tone` colors the confirm button: 'primary' uses the accent (create/rename),
// 'danger' is red (clear), 'danger-dark' a deeper red (delete), 'danger-darkest'
// the deepest (erase all). Every dialog shares the same layout — only the
// button color changes.
export default function SessionModal({
  title,
  body,
  confirmLabel,
  danger = false,
  tone = danger ? "danger" : "primary",
  noInput = false,
  defaultValue = "",
  onCancel,
  onSubmit,
}) {
  const [name, setName] = useState(defaultValue);
  const trimmed = name.trim();
  const inputRef = useRef(null);
  const confirmClass =
    tone === "primary"
      ? "modal-btn primary"
      : tone === "danger-darkest"
        ? "modal-btn danger danger-darkest"
        : tone === "danger-dark"
          ? "modal-btn danger danger-dark"
          : "modal-btn danger";

  useEffect(() => {
    if (!danger && !noInput) inputRef.current?.focus();
  }, [danger, noInput]);

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
        {!danger && !noInput && (
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
            className={confirmClass}
            disabled={!danger && !noInput && !trimmed}
            onClick={() => (danger || noInput ? onSubmit() : onSubmit(trimmed))}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}