import { useState, useEffect } from "react";
import Dropdown from "./Dropdown.jsx";
import SessionModal from "./SessionModal.jsx";

const ACCENTS = [
  { name: "Orange", hex: "#fb8c00" },
  { name: "Green", hex: "#43a047" },
  { name: "Blue", hex: "#42a5f5" },
  { name: "Purple", hex: "#ab47bc" },
  { name: "Red", hex: "#e53935" },
  { name: "Teal", hex: "#26a69a" },
];

const STAT_OPTIONS = [
  { key: "ao5", label: "Ao5" },
  { key: "ao12", label: "Ao12" },
  { key: "ao50", label: "Ao50" },
  { key: "ao100", label: "Ao100" },
  { key: "mean", label: "Mean" },
  { key: "best", label: "Best" },
  { key: "worst", label: "Worst" },
  { key: "sd", label: "Std Dev" },
];

function Section({ icon, title, children, wide, danger }) {
  return (
    <section
      className={`settings-section${wide ? " settings-section-wide" : ""}${
        danger ? " settings-section-danger" : ""
      }`}
    >
      <div className="settings-section-header">
        <i className={`bx ${icon}`}></i>
        <span>{title}</span>
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-knob"></span>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="settings-seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? "active" : ""}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SelectField({ value, onChange, options, ariaLabel }) {
  return (
    <Dropdown
      variant="compact"
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
    />
  );
}

function NumberField({ value, onChange, suffix }) {
  return (
    <label className="settings-number">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && <span>{suffix}</span>}
    </label>
  );
}

function Slider({ value, onChange, min, max }) {
  return (
    <div className="settings-slider-wrap">
      <input
        type="range"
        className="settings-slider"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="settings-slider-value">{value}</span>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`settings-chip${active ? " active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function KbdButton({ keys, title, onChange }) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return undefined;
    function handleKey(e) {
      e.preventDefault();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      if (e.key === " ") return; // space is reserved for the timer
      onChange(e.key);
      setRecording(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [recording, onChange]);

  return (
    <button
      type="button"
      className={`settings-kbd-btn${recording ? " recording" : ""}`}
      title={title}
      onClick={() => setRecording(true)}
    >
      <span className="settings-kbd">{recording ? "Press key…" : keys}</span>
      <i className="bx bx-edit-alt"></i>
    </button>
  );
}

export default function SettingsPage({ sessions, activeId, accent, onAccentChange, customScramble, onCustomScrambleChange, precision, onPrecisionChange, penaltyKey, onPenaltyKeyChange, dnfKey, onDnfKeyChange, onClearSession, onClearAllData }) {
  const [language, setLanguage] = useState("en");
  const [inspection, setInspection] = useState(true);
  const [inspectionSeconds, setInspectionSeconds] = useState("15");
  const [hideDuringSolve, setHideDuringSolve] = useState(false);
  const [beep8, setBeep8] = useState(true);
  const [beep12, setBeep12] = useState(true);
  const [completionSound, setCompletionSound] = useState(true);
  const [volume, setVolume] = useState(70);
  const [statSet, setStatSet] = useState(
    new Set(["ao5", "ao12", "ao50", "ao100", "best"]),
  );
  const [outlier, setOutlier] = useState("wca");
  const [statPrecision, setStatPrecision] = useState("2");
  const [rollingWindow, setRollingWindow] = useState("17");
  const [theme, setTheme] = useState("dark");
  const [fontScale, setFontScale] = useState("normal");
  const [animation, setAnimation] = useState("full");
  // Which destructive action is awaiting confirmation: 'session' | 'all' | null
  const [confirmDialog, setConfirmDialog] = useState(null);

  const toggleStat = (key) => {
    setStatSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const activeSolves = activeSession?.solves.length ?? 0;
  const totalSessions = sessions.length;
  const totalSolves = sessions.reduce((n, s) => n + s.solves.length, 0);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-heading">
          <h1 className="settings-title">Settings</h1>
          <span className="settings-subtitle">
            Timer behavior, statistics, and data
          </span>
        </div>
        <button
          type="button"
          className="settings-reset"
          title="Reset to defaults"
        >
          <i className="bx bx-reset"></i> Reset to defaults
        </button>
      </div>

      <div className="settings-sections">
        <Section icon="bx-globe" title="General">
          <Row label="Language" hint="Interface language">
            <SelectField
              value={language}
              onChange={setLanguage}
              options={[
                { value: "en", label: "English" },
                { value: "zh", label: "中文" },
                { value: "es", label: "Español" },
                { value: "fr", label: "Français" },
                { value: "de", label: "Deutsch" },
                { value: "ja", label: "日本語" },
              ]}
              ariaLabel="Language"
            />
          </Row>
        </Section>

        <Section icon="bx-shuffle" title="Scrambles">
          <Row
            label="Custom scramble"
            hint="Use your own scramble instead of a generated one"
          >
            <Toggle checked={customScramble} onChange={onCustomScrambleChange} />
          </Row>
        </Section>

        <Section icon="bx-time" title="Timing">
          <Row label="WCA-style inspection" hint="15s default, 8s/12s warnings">
            <Toggle checked={inspection} onChange={setInspection} />
          </Row>
          {inspection && (
            <Row
              label="Inspection duration"
              hint="Seconds allowed before the solve starts"
            >
              <NumberField
                value={inspectionSeconds}
                onChange={setInspectionSeconds}
                suffix="s"
              />
            </Row>
          )}
          <Row label="Time precision" hint="Decimal places shown on the timer">
            <Segmented
              options={[
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
              value={precision}
              onChange={onPrecisionChange}
            />
          </Row>
          <Row
            label="Hide time during solve"
            hint="BLD-friendly — hides the running clock"
          >
            <Toggle checked={hideDuringSolve} onChange={setHideDuringSolve} />
          </Row>
        </Section>

        <Section icon="bx-volume-full" title="Sound & haptics">
          <Row label="Beep at 8s warning" hint="During inspection">
            <Toggle checked={beep8} onChange={setBeep8} />
          </Row>
          <Row label="Beep at 12s warning" hint="During inspection">
            <Toggle checked={beep12} onChange={setBeep12} />
          </Row>
          <Row label="Completion sound" hint="Played when the timer stops">
            <Toggle checked={completionSound} onChange={setCompletionSound} />
          </Row>
          <Row label="Volume" hint="Master volume for beeps and sounds">
            <Slider value={volume} onChange={setVolume} min={0} max={100} />
          </Row>
        </Section>

        <Section icon="bx-palette" title="Appearance">
          <Row label="Theme" hint="Color scheme for the app">
            <Segmented
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "custom", label: "Custom" },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </Row>
          <Row label="Accent color" hint="Highlight color for active elements">
            <div className="settings-swatches">
              {ACCENTS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="settings-swatch"
                  style={{ background: c.hex }}
                  title={c.name}
                  onClick={() => onAccentChange(c.hex)}
                >
                  {accent === c.hex && <i className="bx bx-check"></i>}
                </button>
              ))}
              <label
                className="settings-swatch settings-swatch-custom"
                title="Custom color"
              >
                <i className="bx bx-paint-roll"></i>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => onAccentChange(e.target.value)}
                />
              </label>
            </div>
          </Row>
          <Row label="Font size" hint="UI scaling">
            <Segmented
              options={[
                { value: "small", label: "Small" },
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
              ]}
              value={fontScale}
              onChange={setFontScale}
            />
          </Row>
          <Row label="Animation intensity" hint="Motion across the app">
            <Segmented
              options={[
                { value: "full", label: "Full" },
                { value: "reduced", label: "Reduced" },
                { value: "off", label: "Off" },
              ]}
              value={animation}
              onChange={setAnimation}
            />
          </Row>
        </Section>

        <Section icon="bx-bar-chart-alt-2" title="Averages">
          <Row
            label="Stats shown"
            hint="Which averages appear on the timer and stats page"
          >
            <div className="settings-chip-row">
              {STAT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  active={statSet.has(opt.key)}
                  onClick={() => toggleStat(opt.key)}
                />
              ))}
            </div>
          </Row>
          <Row
            label="Outlier handling"
            hint="How DNFs and +2s factor into averages"
          >
            <SelectField
              value={outlier}
              onChange={setOutlier}
              options={[
                { value: "wca", label: "WCA — DNF is worst, +2 counts" },
                { value: "lenient", label: "Lenient — ignore DNFs" },
                { value: "strict", label: "Strict — DNF breaks the average" },
                { value: "trim", label: "Trim best & worst" },
              ]}
              ariaLabel="Outlier handling"
            />
          </Row>
          <Row label="Stat precision" hint="Decimal places for statistics">
            <Segmented
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
              value={statPrecision}
              onChange={setStatPrecision}
            />
          </Row>
          <Row
            label="Custom average window"
            hint="Solves per custom average (e.g. Ao17)"
          >
            <NumberField
              value={rollingWindow}
              onChange={setRollingWindow}
              suffix="solves"
            />
          </Row>
        </Section>

        <Section icon="bx-key" title="Tagging">
          <Row label="+2 quick-tag" hint="Add a 2-second penalty to the last solve">
            <KbdButton keys={penaltyKey} title="Change hotkey" onChange={onPenaltyKeyChange} />
          </Row>
          <Row label="DNF quick-tag" hint="Mark the last solve as Did Not Finish">
            <KbdButton keys={dnfKey} title="Change hotkey" onChange={onDnfKeyChange} />
          </Row>
        </Section>

        <Section icon="bx-data" title="Data">
          <Row label="Export" hint="Download your solve history">
            <div className="settings-btn-row">
              <button type="button" className="settings-btn">
                <i className="bx bx-download"></i> CSV
              </button>
              <button type="button" className="settings-btn">
                <i className="bx bx-download"></i> JSON
              </button>
            </div>
          </Row>
          <Row
            label="Import from another timer"
            hint="Supports csTimer, TNoodle, Twizzle, …"
          >
            <button type="button" className="settings-btn settings-btn-ghost">
              <i className="bx bx-upload"></i> Import file
            </button>
          </Row>
        </Section>

        <Section
          wide
          danger
          icon="bx-error-circle"
          title="Danger zone"
        >
          <Row
            label="Clear session"
            hint="Removes solves from the current session"
          >
            <button
              type="button"
              className="settings-btn settings-btn-danger-outline"
              onClick={() => setConfirmDialog("session")}
            >
              <i className="bx bx-trash"></i> Clear session
            </button>
          </Row>
          <Row
            label="Erase all data"
            hint="Deletes every session and solve. This cannot be undone."
          >
            <button
              type="button"
              className="settings-btn settings-btn-danger-fill"
              onClick={() => setConfirmDialog("all")}
            >
              <i className="bx bx-trash"></i> Erase all data
            </button>
          </Row>
        </Section>
      </div>

      {confirmDialog === "session" && (
        <SessionModal
          title={`Clear "${activeSession?.name ?? "current session"}"?`}
          body={`This will permanently delete all ${activeSolves} ${
            activeSolves === 1 ? "solve" : "solves"
          } in this session.`}
          confirmLabel="Clear"
          danger
          onCancel={() => setConfirmDialog(null)}
          onSubmit={() => {
            onClearSession();
            setConfirmDialog(null);
          }}
        />
      )}
      {confirmDialog === "all" && (
        <SessionModal
          title="Clear all data?"
          body={`This will permanently delete all ${totalSessions} ${
            totalSessions === 1 ? "session" : "sessions"
          } and ${totalSolves} ${totalSolves === 1 ? "solve" : "solves"}. It cannot be undone.`}
          confirmLabel="Erase all"
          danger
          tone="danger-darkest"
          onCancel={() => setConfirmDialog(null)}
          onSubmit={() => {
            onClearAllData();
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
}
