import { useEffect, useMemo, useRef, useState } from 'react';

// Custom dropdown replacing native <select>, so the popup can be styled to
// match the app's design language (Geist Mono, flat dark panels, sharp
// corners, muted uppercase group labels). Supports flat `options` or grouped
// `groups` (like the event picker's optgroups).
//
//   <Dropdown value={x} onChange={fn} options={[{value,label}]} variant="compact" />
//   <Dropdown value={x} onChange={fn} groups={[{group, options}]} variant="header" />
export default function Dropdown({
  value,
  onChange,
  groups,
  options,
  variant = 'header',
  ariaLabel,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const sections = useMemo(
    () => groups ?? [{ group: null, options: options ?? [] }],
    [groups, options],
  );

  const itemList = useMemo(
    () => sections.flatMap((s) => s.options.map((opt) => ({ ...opt, group: s.group }))),
    [sections],
  );

  const selectedLabel = itemList.find((o) => o.value === value)?.label;

  const openMenu = () => {
    setHighlight(itemList.findIndex((o) => o.value === value));
    setOpen(true);
  };

  const select = (item) => {
    onChange(item.value);
    setOpen(false);
  };

  // Close when clicking/tapping outside the dropdown.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  // Reset keyboard highlight when the menu opens/closes.
  useEffect(() => {
    if (!open) setHighlight(-1);
  }, [open]);

  // Keep the keyboard-highlighted option scrolled into view inside the menu.
  useEffect(() => {
    if (!open || highlight < 0) return;
    const el = rootRef.current?.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, highlight]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, itemList.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlight >= 0 && itemList[highlight]) select(itemList[highlight]);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const renderItems = [];
  let index = 0;
  for (const section of sections) {
    if (section.group) {
      renderItems.push({ type: 'label', text: section.group, key: `label:${section.group}` });
    }
    for (const opt of section.options) {
      renderItems.push({ type: 'option', opt, index, key: `option:${opt.value}` });
      index += 1;
    }
  }

  return (
    <div
      ref={rootRef}
      className={`dropdown dd-${variant}${open ? ' open' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span className="dropdown-label">{selectedLabel ?? value}</span>
        <i className="bx bx-chevron-down dropdown-chevron"></i>
      </button>

      {open && (
        <div className="dropdown-menu" role="listbox" aria-label={ariaLabel}>
          {renderItems.map((item) =>
            item.type === 'label' ? (
              <div key={item.key} className="dropdown-group-label" role="presentation">
                {item.text}
              </div>
            ) : (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={item.opt.value === value}
                data-index={item.index}
                className={`dropdown-option${
                  item.opt.value === value ? ' selected' : ''
                }${highlight === item.index ? ' highlight' : ''}`}
                onMouseEnter={() => setHighlight(item.index)}
                onClick={() => select(item.opt)}
              >
                <span className="dropdown-option-label">{item.opt.label}</span>
                <i className="bx bx-check dropdown-check"></i>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
