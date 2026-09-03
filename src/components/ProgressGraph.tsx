import React, { useState, useMemo, useCallback } from 'react';
import type { WorkoutSession, UserSettings, PRRecord } from '../types/gym';
import { kgToLbs } from '../engine/overloadEngine';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  TrendingUp,
  Award,
  Zap,
  ChevronDown,
  BarChart2,
  Dumbbell
} from 'lucide-react';

interface ProgressGraphProps {
  historySessions: WorkoutSession[];
  prs: PRRecord[];
  settings: UserSettings;
}

type GraphMode = 'volume' | 'exercise' | 'frequency';
type Timeframe = '30d' | '90d' | 'all';

interface ChartPoint {
  id: string;
  x: number;
  y: number;
  date: string;
  displayDate: string;
  value: number;
  displayValue: string;
  label: string;
  isPR?: boolean;
  subLabel?: string;
}

export const ProgressGraph: React.FC<ProgressGraphProps> = ({
  historySessions,
  prs,
  settings
}) => {
  const [mode, setMode] = useState<GraphMode>('volume');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Extract all unique exercises ever logged in history
  const loggedExercises = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const s of historySessions) {
      for (const e of s.exercises) {
        if (!map.has(e.exerciseId)) {
          map.set(e.exerciseId, { id: e.exerciseId, name: e.name, count: 0 });
        }
        map.get(e.exerciseId)!.count++;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [historySessions]);

  // If no exercise selected yet and no logged exercises, fallback to popular library exercise
  const currentExerciseId = selectedExerciseId || (loggedExercises[0]?.id ?? 'sled-hack-squat');

  const displayWeight = useCallback((kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  }, [settings.unit]);

  const displayVolume = useCallback((kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  }, [settings.unit]);

  // Filter sessions by timeframe safely
  const [mountTime] = useState(() => Date.now());
  const filteredSessions = useMemo(() => {
    const sorted = [...historySessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (timeframe === 'all') return sorted;
    const daysLimit = timeframe === '30d' ? 30 : 90;
    const cutoff = mountTime - daysLimit * 24 * 60 * 60 * 1000;
    return sorted.filter((s) => new Date(s.date).getTime() >= cutoff);
  }, [historySessions, timeframe, mountTime]);

  // Build raw series points based on selected mode
  const rawPoints = useMemo(() => {
    if (mode === 'volume') {
      return filteredSessions.map((s, idx) => {
        const val = settings.unit === 'lbs' ? kgToLbs(s.totalVolumeKg) : s.totalVolumeKg;
        const d = new Date(s.date);
        return {
          id: s.id || `session-${idx}`,
          date: s.date,
          displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: val,
          displayValue: displayVolume(s.totalVolumeKg),
          label: s.routineName.split(':')[0],
          isPR: s.prCount > 0,
          subLabel: `${s.exercises.length} exercises · ${Math.round(s.durationSeconds / 60)}m`
        };
      });
    }

    if (mode === 'exercise') {
      const points: {
        id: string;
        date: string;
        displayDate: string;
        value: number;
        displayValue: string;
        label: string;
        isPR?: boolean;
        subLabel?: string;
      }[] = [];

      for (const s of filteredSessions) {
        const matchEx = s.exercises.find(
          (e) => e.exerciseId === currentExerciseId || e.name.toLowerCase() === currentExerciseId.toLowerCase()
        );
        if (matchEx) {
          const completedSets = matchEx.sets.filter((st) => st.completed);
          if (completedSets.length > 0) {
            const topSet = completedSets.reduce((max, curr) => (curr.weightKg > max.weightKg ? curr : max), completedSets[0]);
            const val = settings.unit === 'lbs' ? kgToLbs(topSet.weightKg) : topSet.weightKg;
            const hasPR = completedSets.some((st) => st.isPR) || prs.some((p) => p.exerciseId === currentExerciseId && Math.abs(p.value - topSet.weightKg) < 0.5);
            const d = new Date(s.date);
            points.push({
              id: `${s.id}-${matchEx.id}`,
              date: s.date,
              displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              value: val,
              displayValue: displayWeight(topSet.weightKg),
              label: `${topSet.weightKg}kg × ${topSet.reps} reps`,
              isPR: hasPR,
              subLabel: `${completedSets.length} sets completed`
            });
          }
        }
      }
      return points;
    }

    // Frequency mode: Group by week
    const weekMap = new Map<string, { count: number; volume: number; firstDate: Date }>();
    for (const s of filteredSessions) {
      const d = new Date(s.date);
      // Start of week (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      const key = weekStart.toISOString().split('T')[0];
      if (!weekMap.has(key)) {
        weekMap.set(key, { count: 0, volume: 0, firstDate: weekStart });
      }
      const entry = weekMap.get(key)!;
      entry.count++;
      entry.volume += s.totalVolumeKg;
    }

    return Array.from(weekMap.entries()).map(([key, data]) => ({
      id: key,
      date: key,
      displayDate: data.firstDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: data.count,
      displayValue: `${data.count} sessions`,
      label: `Week of ${data.firstDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      isPR: false,
      subLabel: `Volume: ${displayVolume(data.volume)}`
    }));
  }, [mode, filteredSessions, displayWeight, displayVolume, settings.unit, currentExerciseId, prs]);

  // Chart Dimensions & Coordinate Mapping
  const chartWidth = 340;
  const chartHeight = 160;
  const padLeft = 32;
  const padRight = 18;
  const padTop = 22;
  const padBottom = 28;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const { chartPoints, pathD, areaD, minY, maxY, avgY } = useMemo(() => {
    if (rawPoints.length === 0) {
      return { chartPoints: [], pathD: '', areaD: '', minY: 0, maxY: 0, avgY: 0 };
    }

    const values = rawPoints.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Buffer range by 10%
    const scaleMin = Math.max(0, minVal - range * 0.15);
    const scaleMax = maxVal + range * 0.15;
    const scaleRange = scaleMax - scaleMin || 1;

    const points: ChartPoint[] = rawPoints.map((p, i) => {
      const x = rawPoints.length === 1 ? padLeft + innerW / 2 : padLeft + (i / (rawPoints.length - 1)) * innerW;
      const y = padTop + innerH - ((p.value - scaleMin) / scaleRange) * innerH;
      return {
        ...p,
        x,
        y
      };
    });

    // Build smooth cubic Bezier curve
    if (points.length === 1) {
      const p = points[0];
      return {
        chartPoints: points,
        pathD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y}`,
        areaD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y} L ${p.x + 20},${padTop + innerH} L ${p.x - 20},${padTop + innerH} Z`,
        minY: scaleMin,
        maxY: scaleMax,
        avgY: avg
      };
    }

    let linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const groundY = padTop + innerH;
    const areaPath = `${linePath} L ${lastX},${groundY} L ${firstX},${groundY} Z`;

    return {
      chartPoints: points,
      pathD: linePath,
      areaD: areaPath,
      minY: scaleMin,
      maxY: scaleMax,
      avgY: avg
    };
  }, [rawPoints, innerW, innerH]);

  // Selected or active point for tooltip
  const activePoint = useMemo(() => {
    if (activePointIndex !== null && chartPoints[activePointIndex]) {
      return chartPoints[activePointIndex];
    }
    return chartPoints[chartPoints.length - 1] || null;
  }, [activePointIndex, chartPoints]);

  // Progression summary metrics
  const summaryMetrics = useMemo(() => {
    if (rawPoints.length < 2) {
      return { growthPct: 0, peakVal: rawPoints[0]?.value || 0, isPositive: true };
    }
    const firstVal = rawPoints[0].value;
    const lastVal = rawPoints[rawPoints.length - 1].value;
    const maxVal = Math.max(...rawPoints.map((p) => p.value));
    const diff = lastVal - firstVal;
    const pct = Math.round((diff / (firstVal || 1)) * 100);
    return {
      growthPct: pct,
      peakVal: maxVal,
      isPositive: pct >= 0
    };
  }, [rawPoints]);

  // Exercise friendly name
  const currentExerciseName = useMemo(() => {
    const match = EXERCISE_LIBRARY.find((e) => e.id === currentExerciseId);
    return match?.name || loggedExercises.find((e) => e.id === currentExerciseId)?.name || 'Exercise';
  }, [currentExerciseId, loggedExercises]);

  return (
    <div className="gym-card" style={{ padding: '16px' }}>
      {/* Header & Mode Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Progression Graph
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Track mechanical overload over time
              </span>
            </div>
          </div>

          {/* Timeframe Pill */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              padding: 2,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {(['30d', '90d', 'all'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                  color: timeframe === tf ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            background: 'var(--bg-surface)',
            padding: 3,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            onClick={() => {
              setMode('volume');
              setActivePointIndex(null);
            }}
            style={{
              background: mode === 'volume' ? 'rgba(0, 245, 155, 0.18)' : 'transparent',
              color: mode === 'volume' ? 'var(--accent-volt)' : 'var(--text-secondary)',
              border: mode === 'volume' ? '1px solid rgba(0, 245, 155, 0.35)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Zap size={13} />
            Volume
          </button>
          <button
            onClick={() => {
              setMode('exercise');
              setActivePointIndex(null);
            }}
            style={{
              background: mode === 'exercise' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: mode === 'exercise' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: mode === 'exercise' ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Dumbbell size={13} />
            Exercise PR
          </button>
          <button
            onClick={() => {
              setMode('frequency');
              setActivePointIndex(null);
            }}
            style={{
              background: mode === 'frequency' ? 'rgba(255, 184, 0, 0.18)' : 'transparent',
              color: mode === 'frequency' ? 'var(--accent-amber)' : 'var(--text-secondary)',
              border: mode === 'frequency' ? '1px solid rgba(255, 184, 0, 0.35)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <BarChart2 size={13} />
            Consistency
          </button>
        </div>
      </div>

      {/* Exercise Dropdown (Only visible in 'exercise' mode) */}
      {mode === 'exercise' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, display: 'block' }}>
            Select Exercise to Graph
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={currentExerciseId}
              onChange={(e) => {
                setSelectedExerciseId(e.target.value);
                setActivePointIndex(null);
              }}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '8px 32px 8px 12px',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              {loggedExercises.length > 0 ? (
                loggedExercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.count} workouts)
                  </option>
                ))
              ) : (
                EXERCISE_LIBRARY.slice(0, 15).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.equipment})
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={16}
              color="var(--text-secondary)"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Interactive Tooltip Callout */}
      {activePoint ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {activePoint.displayDate} · {activePoint.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  color: mode === 'exercise' ? 'var(--accent-cyan)' : 'var(--accent-volt)'
                }}
              >
                {activePoint.displayValue}
              </span>
              {activePoint.isPR && (
                <span className="pr-badge-gold" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  <Award size={10} /> PR
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {activePoint.subLabel || 'Tap point to inspect'}
            </span>
          </div>
        </div>
      ) : null}

      {/* Interactive SVG Line & Area Graph */}
      {chartPoints.length === 0 ? (
        <div
          style={{
            height: 160,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            padding: 20,
            textAlign: 'center'
          }}
        >
          <Dumbbell size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
          <span>No workout data found for this selection.</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Complete your scheduled sessions to begin rendering progression curves.
          </span>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <defs>
              {/* Volume Gradient */}
              <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F59B" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#00F59B" stopOpacity="0.0" />
              </linearGradient>

              {/* Cyan Gradient */}
              <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter */}
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle Grid Horizontal Lines */}
            {[0, 0.5, 1].map((pct, idx) => {
              const y = padTop + pct * innerH;
              return (
                <line
                  key={idx}
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Average Reference Line (Dashed) */}
            {rawPoints.length > 1 && (
              <line
                x1={padLeft}
                y1={padTop + innerH - ((avgY - minY) / (maxY - minY || 1)) * innerH}
                x2={chartWidth - padRight}
                y2={padTop + innerH - ((avgY - minY) / (maxY - minY || 1)) * innerH}
                stroke="rgba(0, 229, 255, 0.3)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )}

            {/* Area Fill */}
            <path
              d={areaD}
              fill={mode === 'exercise' ? 'url(#cyanFill)' : 'url(#volFill)'}
            />

            {/* Main Spline Line */}
            <path
              d={pathD}
              fill="none"
              stroke={mode === 'exercise' ? 'var(--accent-cyan)' : 'var(--accent-volt)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowEffect)"
            />

            {/* Data Points */}
            {chartPoints.map((p, idx) => {
              const isActive = activePoint?.id === p.id;
              return (
                <g key={p.id} onClick={() => setActivePointIndex(idx)} style={{ cursor: 'pointer' }}>
                  {/* Invisible enlarged hit target for mobile tapping */}
                  <circle cx={p.x} cy={p.y} r={16} fill="transparent" />

                  {/* Outer active pulse ring */}
                  {isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={9}
                      fill="none"
                      stroke={p.isPR ? '#FFD700' : 'var(--accent-volt)'}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Dot point */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.isPR ? 5.5 : isActive ? 5 : 3.5}
                    fill={p.isPR ? '#FFD700' : mode === 'exercise' ? 'var(--accent-cyan)' : 'var(--accent-volt)'}
                    stroke="#0A0D14"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Bottom X-Axis Date Labels */}
            {chartPoints.map((p, i) => {
              // Show only first, middle, and last to avoid clutter
              const total = chartPoints.length;
              const shouldShow =
                total <= 5 ||
                i === 0 ||
                i === total - 1 ||
                (total > 5 && i === Math.floor(total / 2));
              if (!shouldShow) return null;
              return (
                <text
                  key={`lbl-${p.id}`}
                  x={p.x}
                  y={chartHeight - 8}
                  textAnchor={i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle'}
                  fontSize="9"
                  fill="var(--text-muted)"
                  fontWeight="600"
                >
                  {p.displayDate}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      {/* Bottom Growth & Milestone Callout Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            {mode === 'exercise' ? 'Exercise' : 'Tracked Points'}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {mode === 'exercise' ? currentExerciseName : `${rawPoints.length} Workouts`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Peak Record
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFD700', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {mode === 'volume'
              ? displayVolume(summaryMetrics.peakVal)
              : mode === 'exercise'
              ? displayWeight(summaryMetrics.peakVal)
              : `${summaryMetrics.peakVal} / wk`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Overload Trend
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: summaryMetrics.isPositive ? 'var(--accent-volt)' : 'var(--accent-crimson)',
              marginTop: 1
            }}
          >
            {summaryMetrics.growthPct > 0 ? `+${summaryMetrics.growthPct}%` : `${summaryMetrics.growthPct}%`}
          </div>
        </div>
      </div>
    </div>
  );
};
