import React, { useState, useMemo } from 'react';
import type { WorkoutSession, UserSettings } from '../types/gym';
import { kgToLbs } from '../engine/overloadEngine';
import {
  getExerciseTrackingType,
  displayDistance,
  distanceUnitLabel,
  formatDuration,
  displayWeight
} from '../utils/trackingTypeUtils';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Dumbbell,
  Clock,
  Calendar as CalendarIcon,
  Sparkles
} from 'lucide-react';

interface WorkoutCalendarProps {
  historySessions: WorkoutSession[];
  settings: UserSettings;
  onSelectSession?: (session: WorkoutSession) => void;
}

function toLocalDateKey(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  historySessions,
  settings,
  onSelectSession
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toLocalDateKey(today));

  // Map workouts by date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of historySessions) {
      const key = toLocalDateKey(session.date);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(session);
    }
    return map;
  }, [historySessions]);

  // Compute month calendar grid
  const { daysInMonth, startDayOffset, monthName } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Sunday = 0, Monday = 1. We want Monday = 0, Sunday = 6
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const numDays = lastDay.getDate();

    const name = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { daysInMonth: numDays, startDayOffset: startOffset, monthName: name };
  }, [currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateKey(toLocalDateKey(now));
  };

  // Month Statistics
  const monthStats = useMemo(() => {
    let workoutCount = 0;
    let volumeKg = 0;
    let prsCount = 0;
    let totalMinutes = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const sessions = sessionsByDate.get(dateKey);
      if (sessions && sessions.length > 0) {
        workoutCount += sessions.length;
        for (const s of sessions) {
          volumeKg += s.totalVolumeKg;
          prsCount += s.prCount || 0;
          totalMinutes += Math.round(s.durationSeconds / 60);
        }
      }
    }

    return { workoutCount, volumeKg, prsCount, totalMinutes };
  }, [currentYear, currentMonth, daysInMonth, sessionsByDate]);

  // Streak calculation (days with workout in recent sequence)
  const streakCount = useMemo(() => {
    let streak = 0;
    const checkDate = new Date();
    // Check if workout today or yesterday to start streak
    let cursorKey = toLocalDateKey(checkDate);
    if (!sessionsByDate.has(cursorKey)) {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      cursorKey = toLocalDateKey(checkDate);
      if (!sessionsByDate.has(cursorKey)) {
        return 0;
      }
    }

    // Walk backwards
    while (sessionsByDate.has(cursorKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      cursorKey = toLocalDateKey(checkDate);
    }
    return streak;
  }, [sessionsByDate]);

  const displayVolume = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg).toFixed(2)} lbs`;
    return `${(Math.round(kg * 100) / 100).toFixed(2)} kg`;
  };

  const selectedSessions = sessionsByDate.get(selectedDateKey) || [];
  const isSelectedToday = selectedDateKey === toLocalDateKey(today);

  // Selected date formatted
  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, [selectedDateKey]);

  return (
    <div className="gym-card" style={{ padding: '16px' }}>
      {/* Month Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 245, 155, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-volt)'
            }}
          >
            <CalendarIcon size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              {monthName}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Workout & Consistency Calendar
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.7rem', height: 28 }}
            onClick={handleJumpToToday}
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Monthly KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          background: 'var(--bg-surface)',
          padding: '10px 8px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Workouts
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginTop: 2 }}>
            {monthStats.workoutCount}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Volume
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-volt)', marginTop: 2 }}>
            {displayVolume(monthStats.volumeKg)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            PRs Hit
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#FFD700', marginTop: 2 }}>
            {monthStats.prsCount}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Streak
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 2 }}>
            <Flame size={13} color={streakCount > 0 ? 'var(--accent-volt)' : 'var(--text-muted)'} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: streakCount > 0 ? 'var(--accent-volt)' : 'var(--text-muted)' }}>
              {streakCount}d
            </span>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 800,
          color: 'var(--text-muted)',
          marginBottom: 6
        }}
      >
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
        <span>S</span>
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5
        }}
      >
        {/* Leading empty cells */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ height: 44, opacity: 0 }} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

          const daySessions = sessionsByDate.get(dateKey) || [];
          const hasWorkout = daySessions.length > 0;
          const isSelected = dateKey === selectedDateKey;
          const isTodayCell = dateKey === toLocalDateKey(today);
          const hasPR = daySessions.some((s) => s.prCount > 0);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDateKey(dateKey)}
              style={{
                height: 46,
                background: isSelected
                  ? 'rgba(0, 229, 255, 0.18)'
                  : hasWorkout
                  ? 'rgba(0, 245, 155, 0.08)'
                  : 'var(--bg-surface)',
                border: isSelected
                  ? '1.5px solid var(--accent-cyan)'
                  : isTodayCell
                  ? '1.5px solid var(--border-medium)'
                  : hasWorkout
                  ? '1px solid rgba(0, 245, 155, 0.3)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '2px 0'
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: isSelected || hasWorkout || isTodayCell ? 800 : 500,
                  color: isSelected
                    ? 'var(--accent-cyan)'
                    : isTodayCell
                    ? '#fff'
                    : hasWorkout
                    ? 'var(--accent-volt)'
                    : 'var(--text-secondary)'
                }}
              >
                {dayNum}
              </span>

              {/* Indicator dots/icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, height: 8 }}>
                {hasWorkout && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--accent-volt)',
                      boxShadow: '0 0 6px var(--accent-volt)'
                    }}
                  />
                )}
                {hasPR && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#FFD700',
                      boxShadow: '0 0 6px #FFD700'
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Workout Inspector Card */}
      <div
        style={{
          marginTop: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon size={15} color="var(--accent-cyan)" />
            <strong style={{ fontSize: '0.88rem', color: '#fff' }}>
              {selectedDateLabel}
            </strong>
            {isSelectedToday && (
              <span
                style={{
                  background: 'rgba(0, 229, 255, 0.15)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                Today
              </span>
            )}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {selectedSessions.length === 0
              ? 'Rest Day'
              : `${selectedSessions.length} Workout${selectedSessions.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {selectedSessions.length === 0 ? (
          <div style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Active Rest & Recovery
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Muscle fibers repair and grow during rest periods. Hydrate and hit protein targets!
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedSessions.map((session, sIdx) => (
              <div
                key={session.id || sIdx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(0, 245, 155, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                        {session.routineName}
                      </span>
                      {session.mesocycleWeek && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            background: session.isDeload ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                            color: session.isDeload ? '#C084FC' : 'var(--accent-cyan)'
                          }}
                        >
                          W{session.mesocycleWeek} {session.isDeload ? 'Deload' : ''}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const sessionDistance = session.exercises.reduce((sum, ex) => {
                        return sum + ex.sets.filter((s) => s.completed).reduce((sSum, s) => sSum + (s.distanceKm || 0), 0);
                      }, 0);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={12} />
                            {Math.round(session.durationSeconds / 60)} min
                          </span>
                          {session.totalVolumeKg > 0 && (
                            <>
                              <span>·</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-volt)', fontWeight: 700 }}>
                                <Dumbbell size={12} />
                                {displayVolume(session.totalVolumeKg)}
                              </span>
                            </>
                          )}
                          {sessionDistance > 0 && (
                            <>
                              <span>·</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                {displayDistance(sessionDistance, settings.unit)} {distanceUnitLabel(settings.unit)}
                              </span>
                            </>
                          )}
                          {session.caloriesBurned ? (
                            <>
                              <span>·</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#FF7A00', fontWeight: 700 }}>
                                <Flame size={12} color="#FF7A00" fill="#FF7A00" />
                                {session.caloriesBurned} kcal
                              </span>
                            </>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>

                  {session.prCount > 0 && (
                    <span className="pr-badge-gold" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                      <Trophy size={11} />
                      +{session.prCount} PR
                    </span>
                  )}
                </div>

                {/* Exercises list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                  {session.exercises.map((ex, exI) => {
                    const tType = getExerciseTrackingType(ex, ex.trackingType);
                    const completedSets = ex.sets.filter((s) => s.completed);
                    const count = completedSets.length;
                    let statSummary = '';
                    if (tType === 'distance_time') {
                      const totalDist = completedSets.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
                      statSummary = `${count} sets · ${displayDistance(totalDist, settings.unit)} ${distanceUnitLabel(settings.unit)}`;
                    } else if (tType === 'time_only') {
                      const totalSecs = completedSets.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
                      statSummary = `${count} sets · ${formatDuration(totalSecs)}`;
                    } else if (tType === 'reps_only') {
                      const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
                      statSummary = `${count} sets · ${totalReps} reps`;
                    } else {
                      const maxW = Math.max(...ex.sets.map((s) => s.weightKg), 0);
                      statSummary = `${count} sets · ${displayWeight(maxW, settings.unit)} ${settings.unit} max`;
                    }

                    return (
                      <div
                        key={exI}
                        style={{
                          fontSize: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {ex.name}
                        </span>
                        <span style={{ color: 'var(--accent-volt)', fontFamily: 'var(--font-mono)' }}>
                          {statSummary}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {session.notes && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                    📝 "{session.notes}"
                  </div>
                )}

                {onSelectSession && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '0.72rem', alignSelf: 'flex-start', marginTop: 2 }}
                    onClick={() => onSelectSession(session)}
                  >
                    View Full Workout Summary →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
