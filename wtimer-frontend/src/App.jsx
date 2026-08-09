import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import TimerArea from './components/TimerArea.jsx';
import SidePanel from './components/SidePanel.jsx';
import StatsPage from './components/StatsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import SessionsPage from './components/SessionsPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import { useDarkMode } from './hooks/useDarkMode.js';
import { useSessions } from './sessions/useSessions.js';

// All four nav rows have pages behind them.
const IMPLEMENTED_NAV_INDICES = [0, 1, 2, 3];

export default function App() {
  const [currentEvent, setCurrentEvent] = useState('333');
  const [isDark, toggleDark] = useDarkMode();
  const [navIndex, setNavIndex] = useState(0);
  const [customScramble, setCustomScramble] = useState(false);

  const {
    sessions,
    activeId,
    activeSession,
    switchSession,
    createSession,
    renameSession,
    deleteSession,
    addSolve,
    toggleDnf,
    addPenalty,
    removeSolve,
    clearSession,
  } = useSessions();

  // Store the completed solve into the active session, timestamped so the
  // stats page can group solves by day, along with the scramble that was on
  // screen during the solve.
  const handleSolveComplete = useCallback(
    (elapsedMs, scramble) => {
      addSolve({
        time: elapsedMs,
        event: currentEvent,
        date: Date.now(),
        scramble,
      });
    },
    [addSolve, currentEvent],
  );

  const handleNavSelect = useCallback((i) => {
    if (IMPLEMENTED_NAV_INDICES.includes(i)) setNavIndex(i);
  }, []);

  const view =
    navIndex === 1
      ? 'stats'
      : navIndex === 2
        ? 'settings'
        : navIndex === 3
          ? 'sessions'
          : 'timer';

  // The hook always keeps an active session alive; the solve list the rest of
  // the UI consumes is exactly that session's solves, so timer stats, the
  // solve list and the stats page all follow the active session automatically.
  const solves = activeSession ? activeSession.solves : [];

  return (
    <>
      <Header
        currentEvent={currentEvent}
        onEventChange={setCurrentEvent}
        isDark={isDark}
        onToggleDark={toggleDark}
        sessions={sessions}
        activeSessionId={activeId}
        onSwitchSession={switchSession}
        onCreateSession={createSession}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
      />

      {view === 'timer' ? (
        <div className="main-layout">
          <TimerArea
            currentEvent={currentEvent}
            solves={solves}
            onSolveComplete={handleSolveComplete}
            customScramble={customScramble}
          />
          <SidePanel
            solves={solves}
            currentEvent={currentEvent}
            onClear={clearSession}
            onToggleDnf={toggleDnf}
            onAddPenalty={addPenalty}
            onRemove={removeSolve}
          />
        </div>
      ) : view === 'settings' ? (
        <SettingsPage
          customScramble={customScramble}
          onCustomScrambleChange={setCustomScramble}
          onClearSession={clearSession}
        />
      ) : view === 'sessions' ? (
        <SessionsPage
          sessions={sessions}
          activeSessionId={activeId}
          onToggleDnf={toggleDnf}
          onAddPenalty={addPenalty}
          onRemove={removeSolve}
        />
      ) : (
        <StatsPage
          solves={solves}
          currentEvent={currentEvent}
          onEventChange={setCurrentEvent}
          isDark={isDark}
        />
      )}

      <BottomNav active={navIndex} onSelect={handleNavSelect} />
    </>
  );
}
