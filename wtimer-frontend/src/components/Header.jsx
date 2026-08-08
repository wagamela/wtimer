import { EVENT_OPTIONS } from '../constants/events.js';

export default function Header({ currentEvent, onEventChange, isDark, onToggleDark }) {
  return (
    <div className="header">
      <div className="header-left">
        <span className="logo">wtimer</span>
      </div>
      <div className="header-right">
        <div className="select-wrap">
          <select value={currentEvent} onChange={(e) => onEventChange(e.target.value)}>
            {EVENT_OPTIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <i className="bx bx-chevron-down select-icon"></i>
        </div>
        <button className="dark-toggle" onClick={onToggleDark} title="Toggle dark mode">
          <i className={`bx ${isDark ? 'bx-sun' : 'bx-moon'}`}></i>
        </button>
      </div>
    </div>
  );
}
