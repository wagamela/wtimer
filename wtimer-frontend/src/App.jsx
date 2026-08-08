import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import TimerArea from './components/TimerArea.jsx';
import SidePanel from './components/SidePanel.jsx';
import StatsPage from './components/StatsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import { useDarkMode } from './hooks/useDarkMode.js';

// Timer, Stats and Settings have pages behind them — Sessions is a
// placeholder until that feature exists.
const IMPLEMENTED_NAV_INDICES = [0, 1, 2];

export default function App() {
  const [currentEvent, setCurrentEvent] = useState('333');
  const [solves, setSolves] = useState([]);
  const [isDark, toggleDark] = useDarkMode();
  const [navIndex, setNavIndex] = useState(0);
  const [customScramble, setCustomScramble] = useState(false);

  // Store new solve after a completed timing, timestamped so the stats
  // page can group solves by day.
  const handleSolveComplete = useCallback((elapsedMs) => {
    setSolves((prev) => [...prev, { time: elapsedMs, event: currentEvent, date: Date.now() }]);
  }, [currentEvent]);

  const handleClear = useCallback(() => setSolves([]), []);

  const handleNavSelect = useCallback((i) => {
    if (IMPLEMENTED_NAV_INDICES.includes(i)) setNavIndex(i);
  }, []);

  const view = navIndex === 1 ? 'stats' : navIndex === 2 ? 'settings' : 'timer';

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
          />
          <SidePanel solves={solves} onClear={handleClear} />
        </div>
      ) : view === 'settings' ? (
        <SettingsPage
          customScramble={customScramble}
          onCustomScrambleChange={setCustomScramble}
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
