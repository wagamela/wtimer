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

## Project structure

```
src/
  main.jsx              entry point
  App.jsx                top-level state: solves, currentEvent, dark mode, active page
  style.css               unchanged, just moved into src/ (+ stats page styles)
  components/
    Header.jsx            event dropdown + dark mode toggle
    TimerArea.jsx          scramble + timer display + delta badge
    SidePanel.jsx          AO5/AO12 + solve list + clear button
    StatsPage.jsx           statistics dashboard (see below)
    BottomNav.jsx           bottom nav bar — Timer/Stats now switch pages;
                            Menu/Sessions are still placeholders
  hooks/
    useTimer.js            spacebar hold/ready/running state machine
    useScramble.js          scramble generation + regeneration
    useDarkMode.js           dark mode toggle, syncs body.dark class
  constants/
    events.js               event dropdown options + short labels
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
- **Daily average**: bars per calendar day. Since solves aren't persisted
  yet (see note below), this will usually just show a message that more
  days of data are needed — the chart itself is ready for whenever
  persistence lands.
- **Event comparison**: mean time per event, for whichever events you've
  actually solved in the current session — a stand-in for the goals doc's
  "session comparisons" until the full Sessions feature (separate,
  named practice sessions like "OH Practice" or "Competition Prep")
  exists.

### Deliberately out of scope for now

The goals doc's "Flexible Sessions" is its own main goal (named sessions
with independent history), separate from "event." I didn't build that
here — the stats page filters by *event* (what the timer already tracks),
and the event-comparison chart approximates session comparison until real
sessions exist. Worth building as a following step if you want it.

Solve history still isn't persisted (no localStorage/backend), so daily/
weekly/monthly trends won't have much to show until solves survive a
reload — that's under "Cloud synchronization" in the goals doc's
long-term vision, not something I added here.

## Why it's split up this way

- **`App.jsx` owns the shared state** (`solves`, `currentEvent`, dark mode)
  because both `TimerArea` (which adds new solves) and `SidePanel` (which
  displays them) need access to the same list.
- **`useTimer` is the trickiest hook** — it reproduces the original's exact
  spacebar state machine (hold → ready → running) using refs for the
  timing-critical state (so a re-render never resets it) and only calls
  `setState` when the displayed seconds/centiseconds actually change, same
  optimization as the original `tick()`.
- **`TimerArea` decides what happens on solve completion** (compute the
  delta, hand the new time up via `onSolveComplete`, then ask
  `useScramble` to generate a new scramble) — mirroring the original
  `stopTimer()` function's sequence of actions.

## Notes

- Bottom nav buttons currently just toggle an "active" visual state — like
  the original, there's no routing/page-switching wired up behind them.
- No solve persistence (localStorage etc.) was in the original, so none was
  added — solves reset on page reload, same as before.
