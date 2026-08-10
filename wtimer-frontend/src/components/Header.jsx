import { EVENT_OPTIONS } from '../constants/events.js';
import Dropdown from './Dropdown.jsx';
import SessionSelector from './SessionSelector.jsx';

export default function Header({
  currentEvent,
  onEventChange,
  isDark,
  onToggleDark,
  sessions,
  activeSessionId,
  onSwitchSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  showSessionSwitch = true,
}) {
  return (
    <div className="header">
      <div className="header-left">
        <span className="logo">wtimer</span>
        {showSessionSwitch && (
          <SessionSelector
            variant="header"
            sessions={sessions}
            activeId={activeSessionId}
            onSwitch={onSwitchSession}
            onCreate={onCreateSession}
            onRename={onRenameSession}
            onDelete={onDeleteSession}
          />
        )}
      </div>
      <div className="header-right">
        <Dropdown
          variant="header"
          value={currentEvent}
          onChange={onEventChange}
          groups={EVENT_OPTIONS}
          ariaLabel="Select event"
        />
        <button className="dark-toggle" onClick={onToggleDark} title="Toggle dark mode">
          <i className={`bx ${isDark ? 'bx-sun' : 'bx-moon'}`}></i>
        </button>
      </div>
    </div>
  );
}