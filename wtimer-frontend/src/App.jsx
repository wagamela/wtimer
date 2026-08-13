import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import TimerArea from './components/TimerArea.jsx';
import SidePanel from './components/SidePanel.jsx';
import StatsPage from './components/StatsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import SessionsPage from './components/SessionsPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import { useAccent } from './hooks/useAccent.js';
import { useDarkMode } from './hooks/useDarkMode.js';
import { useSessions } from './sessions/useSessions.js';

// All four nav rows have pages behind them.
const IMPLEMENTED_NAV_INDICES = [0, 1, 2, 3];

export default function App() {
  const [currentEvent, setCurrentEvent] = useState('333');
  const [isDark, toggleDark] = useDarkMode();
  const [accent, setAccent] = useAccent();
  const [navIndex, setNavIndex] = useState(0);
  const [customScramble, setCustomScramble] = useState(false);
  const [precision, setPrecision] = useState("2");
  const [penaltyKey, setPenaltyKey] = useState("1");
  const [dnfKey, setDnfKey] = useState("2");

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
    clearAllData,
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
      ? 'sessions'
      : navIndex === 2
        ? 'stats'
        : navIndex === 3
          ? 'settings'
          : 'timer';

  // The hook always keeps an active session alive; the solve list the rest of
  // the UI consumes is exactly that session's solves, so timer stats, the
  // solve list and the stats page all follow the active session automatically.
  const solves = activeSession ? activeSession.solves : [];

  // Quick-tag hotkeys: apply +2 / DNF to the most recent solve, exactly like
  // the corresponding buttons in the side panel's solve list.
  const tagLastSolvePenalty = useCallback(() => {
    const lastIdx = solves.length - 1;
    if (lastIdx >= 0) addPenalty(activeId, lastIdx);
  }, [solves.length, activeId, addPenalty]);

  const tagLastSolveDnf = useCallback(() => {
    const lastIdx = solves.length - 1;
    if (lastIdx >= 0) toggleDnf(activeId, lastIdx);
  }, [solves.length, activeId, toggleDnf]);

  // Fire the quick-tag hotkeys while on the timer screen, ignoring key presses
  // while typing into an input (e.g. the custom scramble box).
  useEffect(() => {
    if (view !== 'timer') return undefined;
    function handleKeyDown(e) {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === penaltyKey) tagLastSolvePenalty();
      else if (e.key === dnfKey) tagLastSolveDnf();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [view, penaltyKey, dnfKey, tagLastSolvePenalty, tagLastSolveDnf]);

  return (
    <>
      <Header
        currentEvent={currentEvent}
        onEventChange={setCurrentEvent}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      {view === 'timer' ? (
        <div className="main-layout">
          <TimerArea
            currentEvent={currentEvent}
            solves={solves}
            onSolveComplete={handleSolveComplete}
            customScramble={customScramble}
            precision={Number(precision)}
          />
          <SidePanel
            solves={solves}
            currentEvent={currentEvent}
            sessions={sessions}
            activeId={activeId}
            onClear={clearSession}
            onToggleDnf={(index) => toggleDnf(activeId, index)}
            onAddPenalty={(index) => addPenalty(activeId, index)}
            onRemove={(index) => removeSolve(activeId, index)}
            onSwitchSession={switchSession}
            onCreateSession={createSession}
            onRenameSession={renameSession}
            onDeleteSession={deleteSession}
          />
        </div>
      ) : view === 'settings' ? (
        <SettingsPage
          accent={accent}
          onAccentChange={setAccent}
          customScramble={customScramble}
          onCustomScrambleChange={setCustomScramble}
          precision={precision}
          onPrecisionChange={setPrecision}
          penaltyKey={penaltyKey}
          onPenaltyKeyChange={setPenaltyKey}
          dnfKey={dnfKey}
          onDnfKeyChange={setDnfKey}
          onClearSession={clearSession}
          onClearAllData={clearAllData}
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
          accent={accent}
          onEventChange={setCurrentEvent}
          isDark={isDark}
        />
      )}

      <BottomNav active={navIndex} onSelect={handleNavSelect} />
    </>
  );
}
