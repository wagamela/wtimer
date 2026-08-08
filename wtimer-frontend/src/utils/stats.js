// Stats helpers for the Statistics page. All time values are milliseconds.
// `format.js` already has formatTime() and calcAo(); this file adds the
// rest of what the Advanced Statistics / Visual Progress Tracking goals
// call for: mean, std dev, consistency score, rolling averages,
// improvement trend, PB progression, distribution buckets, daily grouping.

export function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sample standard deviation
export function stdDev(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// 0-100, higher = more consistent. Based on coefficient of variation
// (stddev relative to mean) so it's comparable across different solve
// speeds, not just raw spread.
export function consistencyScore(values) {
  const m = mean(values);
  const sd = stdDev(values);
  if (m === null || sd === null || m === 0) return null;
  const cv = sd / m;
  return Math.max(0, Math.min(100, 100 - cv * 100));
}

// Rolling Ao(n): one point per solve, once at least n solves exist.
// This is what powers the "rolling averages" line on the progress chart.
export function rollingAverage(solves, n) {
  return solves.map((_, i) => {
    if (i + 1 < n) return null;
    const windowTimes = solves.slice(i + 1 - n, i + 1).map((s) => s.time);
    const sorted = [...windowTimes].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, sorted.length - 1);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  });
}

// Best time achieved so far, evaluated after each solve.
export function pbProgression(solves) {
  let best = Infinity;
  return solves.map((s) => {
    if (s.time < best) best = s.time;
    return best;
  });
}

// Buckets solve times into a histogram for the distribution graph.
export function distributionBuckets(solves, bucketCount = 10) {
  if (solves.length === 0) return [];
  const times = solves.map((s) => s.time);
  const min = Math.min(...times);
  const max = Math.max(...times);

  if (min === max) {
    return [{ label: (min / 1000).toFixed(1), count: solves.length }];
  }

  const width = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    rangeStart: min + i * width,
    count: 0,
  }));
  times.forEach((t) => {
    const idx = Math.min(bucketCount - 1, Math.floor((t - min) / width));
    buckets[idx].count += 1;
  });
  return buckets.map((b) => ({ ...b, label: (b.rangeStart / 1000).toFixed(1) }));
}

// Compares the mean of the first half of a solve history to the second
// half, to answer "am I actually getting faster?"
export function improvementTrend(solves) {
  if (solves.length < 4) return null;
  const mid = Math.floor(solves.length / 2);
  const firstHalf = mean(solves.slice(0, mid).map((s) => s.time));
  const secondHalf = mean(solves.slice(mid).map((s) => s.time));
  if (!firstHalf) return null;
  return { firstHalf, secondHalf, pctChange: ((secondHalf - firstHalf) / firstHalf) * 100 };
}

// Groups solves by calendar day (local time) for daily-progress views.
export function groupByDay(solves) {
  const groups = new Map();
  solves.forEach((s) => {
    const day = new Date(s.date).toLocaleDateString('sv-SE'); // yyyy-mm-dd, stable sort key
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(s.time);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, times]) => ({
      day,
      mean: mean(times),
      best: Math.min(...times),
      count: times.length,
    }));
}

// Groups all solves (regardless of currently selected event) by event,
// for the event/session comparison chart.
export function groupByEvent(solves) {
  const groups = new Map();
  solves.forEach((s) => {
    if (!groups.has(s.event)) groups.set(s.event, []);
    groups.get(s.event).push(s.time);
  });
  return Array.from(groups.entries()).map(([event, times]) => ({
    event,
    mean: mean(times),
    best: Math.min(...times),
    count: times.length,
  }));
}
