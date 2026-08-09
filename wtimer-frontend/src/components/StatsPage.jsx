import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { EVENT_LABELS } from '../constants/events.js';
import { formatTime, calcAo } from '../utils/format.js';
import {
  mean, stdDev, consistencyScore, rollingAverage, pbProgression,
  distributionBuckets, improvementTrend, groupByDay, groupByEvent,
} from '../utils/stats.js';

// Fixed hex colors (not CSS vars) so recharts' inline SVG styles render
// correctly in both themes without relying on var() support in every
// browser. The stat cards/chart cards stay dark in both themes (see
// --panel-bg in style.css: #1a1a1a light, #2a2a2a dark), so all chart ink
// is light-on-dark and constant; only the tooltip background follows the
// panel tint so hover stats blend with their card.
function useChartColors(isDark) {
  return {
    text: '#f0efed',
    muted: 'rgba(240, 239, 237, 0.4)',
    grid: 'rgba(240, 239, 237, 0.1)',
    cardBg: isDark ? '#2a2a2a' : '#1a1a1a',
    best: '#43a047',
    worst: '#e53935',
  };
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, empty }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <span className="chart-title">{title}</span>
        {subtitle}
      </div>
      {empty ? <div className="chart-empty">{empty}</div> : children}
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter, isDark, colors }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.grid}`,
        borderRadius: 0,
        padding: '8px 12px',
        fontFamily: '"Geist Mono", monospace',
        fontSize: 12,
        color: colors.text,
      }}
    >
      {label !== undefined && <div style={{ opacity: 0.6, marginBottom: 2 }}>{label}</div>}
      {payload.map((p) => (
        <div style={{ color : 'green'}} key={p.dataKey}>{formatter ? formatter(p) : p.value}</div>
      ))}
    </div>
  );
}

export default function StatsPage({ solves, currentEvent, onEventChange, isDark }) {
  const colors = useChartColors(isDark);

  const eventSolves = useMemo(
    () => solves.filter((s) => s.event === currentEvent && !s.dnf),
    [solves, currentEvent],
  );

  const times = useMemo(() => eventSolves.map((s) => s.time), [eventSolves]);

  const ao5 = calcAo(eventSolves, 5);
  const ao12 = calcAo(eventSolves, 12);
  const ao50 = calcAo(eventSolves, 50);
  const ao100 = calcAo(eventSolves, 100);
  const avgAll = mean(times);
  const best = times.length ? Math.min(...times) : null;
  const worst = times.length ? Math.max(...times) : null;
  const sd = stdDev(times);
  const consistency = consistencyScore(times);

  const trend = useMemo(() => improvementTrend(eventSolves), [eventSolves]);

  const progressData = useMemo(() => {
    const rolling = rollingAverage(eventSolves, 5);
    return eventSolves.map((s, i) => ({
      index: i + 1,
      time: s.time / 1000,
      rolling: rolling[i] !== null ? rolling[i] / 1000 : null,
    }));
  }, [eventSolves]);

  const pbData = useMemo(() => {
    const pb = pbProgression(eventSolves);
    return eventSolves.map((s, i) => ({ index: i + 1, pb: pb[i] / 1000 }));
  }, [eventSolves]);

  const distribution = useMemo(() => distributionBuckets(eventSolves, 10), [eventSolves]);

  const dailyData = useMemo(() => {
    const days = groupByDay(eventSolves);
    return days.map((d) => ({ ...d, meanSec: d.mean / 1000, bestSec: d.best / 1000 }));
  }, [eventSolves]);

  const eventComparison = useMemo(() => {
    return groupByEvent(solves)
      .map((g) => ({ ...g, label: EVENT_LABELS[g.event] || g.event, meanSec: g.mean / 1000 }))
      .sort((a, b) => a.meanSec - b.meanSec);
  }, [solves]);

  const hasSolves = eventSolves.length > 0;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1 className="stats-title">Statistics</h1>
      </div>

      {!hasSolves ? (
        <div className="stats-empty">
          <i className="bx bx-line-chart"></i>
          <p>No solves for this event yet.<br />Go back to the timer and complete a few solves to see statistics.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="AO5" value={ao5 !== null ? formatTime(ao5) : '—'} />
            <StatCard label="AO12" value={ao12 !== null ? formatTime(ao12) : '—'} />
            <StatCard label="AO50" value={ao50 !== null ? formatTime(ao50) : '—'} />
            <StatCard label="AO100" value={ao100 !== null ? formatTime(ao100) : '—'} />
            <StatCard label="Mean" value={avgAll !== null ? formatTime(avgAll) : '—'} hint={`${eventSolves.length} solves`} />
            <StatCard label="Best" value={best !== null ? formatTime(best) : '—'} />
            <StatCard label="Worst" value={worst !== null ? formatTime(worst) : '—'} />
            <StatCard label="Std. Dev" value={sd !== null ? formatTime(sd) : '—'} hint="Statistical measure of consistency" />
            <StatCard
              label="Consistency"
              value={consistency !== null ? `${consistency.toFixed(0)}` : '—'}
              hint="0-100, higher = more consistent"
            />
          </div>

          <div className="stats-charts">
            <ChartCard
              title="Progress"
              subtitle={
                trend && (
                  <span className={`trend-badge ${trend.pctChange <= 0 ? 'positive' : 'negative'}`}>
                    {trend.pctChange <= 0 ? '▼' : '▲'} {Math.abs(trend.pctChange).toFixed(1)}%{' '}
                    {trend.pctChange <= 0 ? 'faster' : 'slower'} (vs. first half)
                  </span>
                )
              }
            >
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={progressData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="index" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                  <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    content={(p) => (
                      <ChartTooltip
                        {...p}
                        colors={colors}
                        formatter={(item) => `${item.name === 'time' ? 'Solve' : 'AO5'}: ${item.value.toFixed(2)}s`}
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="time" stroke={colors.muted} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="rolling" stroke={colors.best} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribution" subtitle={<span className="chart-subtitle">Density of solve times</span>}>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                  <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    content={(p) => (
                      <ChartTooltip {...p} colors={colors} formatter={(item) => `${item.value} solves`} />
                    )}
                  />
                  <Bar dataKey="count" fill={colors.muted} radius={[0, 0, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="PB Progression" subtitle={<span className="chart-subtitle">Improvement of the best solve over time</span>}>
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={pbData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="index" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                  <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    content={(p) => (
                      <ChartTooltip {...p} colors={colors} formatter={(item) => `PB: ${item.value.toFixed(2)}s`} />
                    )}
                  />
                  <Line type="stepAfter" dataKey="pb" stroke={colors.best} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Daily Average"
              subtitle={<span className="chart-subtitle">Average time per day</span>}
              empty={
                dailyData.length < 2
                  ? 'All solves are from today — a trend will appear here as more daily data accumulates. Solves persist per session across page reloads.'
                  : null
              }
            >
              {dailyData.length >= 2 && (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                    <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      content={(p) => (
                        <ChartTooltip {...p} colors={colors} formatter={(item) => `Avg: ${item.value.toFixed(2)}s`} />
                      )}
                    />
                    <Bar dataKey="meanSec" fill={colors.muted} radius={[0, 0, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Event Comparison"
              subtitle={<span className="chart-subtitle">Averages of events attempted this session</span>}
              empty={eventComparison.length < 2 ? 'You need solves in at least two different events to compare them.' : null}
            >
              {eventComparison.length >= 2 && (
                <ResponsiveContainer width="100%" height={Math.max(140, eventComparison.length * 34)}>
                  <BarChart data={eventComparison} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                    <YAxis dataKey="label" type="category" tick={{ fill: colors.text, fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip
                      content={(p) => (
                        <ChartTooltip {...p} colors={colors} formatter={(item) => `Avg: ${item.value.toFixed(2)}s`} />
                      )}
                    />
                    <Bar dataKey="meanSec" fill={colors.best} radius={[0, 0, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
