// Format milliseconds as "SS.cc" or "M:SS.cc"
export function formatTime(ms) {
  const secs = Math.floor(ms / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  const mins = Math.floor(secs / 60);
  if (mins > 0) {
    return `${mins}:${String(secs % 60).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }
  return `${secs}.${String(centis).padStart(2, '0')}`;
}

// Average of N, trimming the best and worst solve (standard WCA-style
// average). DNF solves are excluded from averages entirely.
export function calcAo(solves, n) {
  const valid = solves.filter((s) => !s.dnf);
  if (valid.length < n) return null;
  const slice = valid.slice(-n).map((s) => s.time);
  const sorted = [...slice].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

// Best (PB) average of N over any consecutive window of solves. Windows
// that contain a DNF solve are skipped.
export function bestAo(solves, n) {
  const valid = solves.filter((s) => !s.dnf);
  let best = null;
  for (let i = n - 1; i < valid.length; i++) {
    const ao = calcAo(valid.slice(0, i + 1), n);
    if (ao === null) continue;
    if (best === null || ao < best) best = ao;
  }
  return best;
}
