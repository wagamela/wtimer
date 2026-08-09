# wtimer (React)

A React + Vite port of the original vanilla JS speedcubing timer. Same look,
same behavior — just split into components and hooks.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## What changed vs. the original

- **Scramble generation**: originally imported `randomScrambleForEvent` from
  a CDN URL (`cdn.cubing.net`). It's now imported from the `cubing` npm
  package (`cubing/scramble`), which is the standard way to use it in a
  bundled project. Behavior is identical.
- **Everything else is a 1:1 behavioral port** — the spacebar hold-to-start
  timer, delta badge, AO5/AO12 averaging, solve list, dark mode, and event
  dropdown all work exactly as before.
- **Sessions** (new): solves now live inside named sessions, switched from
  the header ("CFOP Practice ▼" sits right beside the event dropdown). Each
  session stores its own solve history and stats, is persisted to
  `localStorage`, and survives reloads. On the first launch the app seeds a
  default "Session 1"; any solve history saved later is kept per session.
  Completed solves record the scramble that was on screen.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx                top-level state: solves, currentEvent, dark mode, active page
  style.css               unchanged, just moved into src/ (+ stats page styles)
  components/
    Header.jsx            event dropdown + dark mode toggle
    TimerArea.jsx          scramble + timer display + delta badge
    SidePanel.jsx          session selector + AO5/AO12 + solve list + clear
    SessionSelector.jsx    session switcher (create/rename/delete/switch)
    SessionModal.jsx       create/rename/confirm-delete dialogs
    SessionsPage.jsx       full solve history of a session, scramble included
    StatsPage.jsx           statistics dashboard (see below)
    BottomNav.jsx           bottom nav bar — Timer/Stats/Settings/Sessions
                            each switch to their page
  hooks/
    useTimer.js            spacebar hold/ready/running state machine
    useScramble.js          scramble generation + regeneration
    useDarkMode.js           dark mode toggle, syncs body.dark class
  constants/
    events.js               event dropdown options + short labels
  sessions/
    sessionStore.js          session model, localStorage persistence, migration
    useSessions.js           sessions state + CRUD (add/switch/create/…)
  utils/
    format.js                formatTime() and calcAo() (average-of-N)
    stats.js                 mean, std dev, consistency score, rolling
                              averages, PB progression, distribution
                              buckets, improvement trend, day/event grouping
```

## Statistics page

Tapping "Stats" in the bottom nav now takes you to a real dashboard,
scoped to whichever event is selected in the dropdown at the top:

- **Stat cards**: AO5, AO12, AO50, AO100, mean, best, worst, standard
  deviation, and a 0–100 consistency score (based on coefficient of
  variation, so it's comparable across events of different speeds).
- **Progress chart**: every solve plotted, with a rolling AO5 line
  overlaid, plus a badge comparing the first half vs. second half of your
  session ("12% faster than your first half," etc.) — the "improvement
  trends" the goals doc calls for.
- **Distribution graph**: histogram of solve times.
- **PB progression**: how your best time has stepped down over the
  session.
- **Daily average**: bars per calendar day. All statistics are scoped to the
  active session, and solves now persist to localStorage — enough to populate
  this chart once a session spans multiple days.
- **Event comparison**: mean time per event, for whichever events you've
  actually solved in the active session.

### Flexible sessions

The goals doc's "Flexible Sessions" is now in place — named sessions with
independent history. The stats page filters by *event* within the active
session (what the timer already tracks). The session switcher in the header
lets you create, rename, delete and jump between sessions from any page; the
**Sessions** tab in the bottom nav shows the selected session's full solve
history — number, time, penalty, event, date and the scramble used for each
solve. Solves persist per session and survive page reloads.

## Why it's split up this way

- **`useSessions` owns shared persistent state** — the session list, active
  session, and all solve mutations. `App.jsx` reads the active session's
  solves from it; `TimerArea` (which adds new solves), `SidePanel` (which
  displays them) and `StatsPage` all consume the same list. CRUD lives behind
  the hook in `sessions/sessionStore.js`.
- **`useTimer` is the trickiest hook** — it reproduces the original's exact
  spacebar state machine (hold → ready → running) using refs for the
  timing-critical state (so a re-render never resets it) and only calls
  `setState` when the displayed seconds/centiseconds actually change, same
  optimization as the original `tick()`.
- **`TimerArea` decides what happens on solve completion** (compute the
  delta, hand the new time up via `onSolveComplete`, then ask
  `useScramble` to generate a new scramble) — mirroring the original
  `stopTimer()` function's sequence of actions. It also passes the scramble
  that was on screen so the solve records it.
- **`sessionStore` keeps data safe** — loading sanitizes corrupt/duplicate
  ids, repairs a missing active session, migrates any legacy flat solve list
  into "Session 1" (idempotently), and always guarantees a default session so
  the app is never left sessionless.
