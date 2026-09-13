import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Sparkles, RefreshCw, CheckCircle2, ArrowRight, SlidersHorizontal } from 'lucide-react';
import type { Exercise } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getSmartExerciseSwap } from '../services/geminiService';
import { SwipeableModalSheet } from './SwipeableModalSheet';
import { ExerciseFilterBar } from './ExerciseFilterBar';

interface SmartSwapModalProps {
  exercise: Exercise;
  apiKey: string;
  onClose: () => void;
  onSelectAlternative: (newExerciseName: string, equipment: string) => void;
}

export const SmartSwapModal: React.FC<SmartSwapModalProps> = ({
  exercise,
  apiKey,
  onClose,
  onSelectAlternative
}) => {
  // Resolve accurate exercise metadata from library
  const resolvedExercise = useMemo(() => {
    const found = EXERCISE_LIBRARY.find(
      (e) => e.id.toLowerCase() === exercise.id.toLowerCase() || e.name.toLowerCase() === exercise.name.toLowerCase()
    );
    return found || exercise;
  }, [exercise]);

  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('Machine or equipment is currently occupied');
  const [result, setResult] = useState<{
    alternativeName: string;
    equipment: string;
    biomechanicsExplanation: string;
    recommendedWeightAdj: string;
  } | null>(null);

  // Search & Filtering States for library alternatives
  const [swapSearchQuery, setSwapSearchQuery] = useState('');
  const [swapMuscleFilter, setSwapMuscleFilter] = useState<string>(resolvedExercise.muscleGroup || 'All');
  const [swapEquipmentFilter, setSwapEquipmentFilter] = useState<string>('All Equipment');
  const [swapDisplayLimit, setSwapDisplayLimit] = useState(40);

  // Reset display limit when filter or search changes
  useEffect(() => {
    setSwapDisplayLimit(40);
  }, [swapSearchQuery, swapMuscleFilter, swapEquipmentFilter]);

  const fetchSwap = useCallback(async (customReason?: string) => {
    setLoading(true);
    try {
      const swap = await getSmartExerciseSwap(resolvedExercise, customReason || reason, apiKey);
      setResult(swap);
    } catch (e) {
      console.error('SmartSwap fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [resolvedExercise, reason, apiKey]);

  useEffect(() => {
    fetchSwap();
  }, [fetchSwap]);

  // Available library alternatives with full tokenized search, category filtering & secondary muscle support
  const filteredAlternatives = useMemo(() => {
    const q = swapSearchQuery.toLowerCase().trim();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    return EXERCISE_LIBRARY.filter((e) => {
      // Exclude current exercise from alternatives
      if (
        e.id.toLowerCase() === resolvedExercise.id.toLowerCase() ||
        e.name.toLowerCase() === resolvedExercise.name.toLowerCase()
      ) {
        return false;
      }

      // Match muscle group (supports macro categories)
      const matchMuscle =
        swapMuscleFilter === 'All' ||
        e.muscleGroup === swapMuscleFilter ||
        (swapMuscleFilter === 'Legs' && ['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(e.muscleGroup)) ||
        (swapMuscleFilter === 'Arms' && ['Biceps', 'Triceps', 'Forearms'].includes(e.muscleGroup)) ||
        (swapMuscleFilter === 'Core' && ['Abs'].includes(e.muscleGroup));
      if (!matchMuscle) return false;

      // Match equipment
      const matchEquipment =
        swapEquipmentFilter === 'All Equipment' ||
        e.equipment.toLowerCase() === swapEquipmentFilter.toLowerCase() ||
        (swapEquipmentFilter === 'Machine' &&
          (e.equipment === 'Machine' || e.name.toLowerCase().includes('lever') || e.equipment === 'Smith Machine'));
      if (!matchEquipment) return false;

      if (tokens.length === 0) return true;

      // Tokenized search across name, equipment, muscleGroup, secondaryMuscles, and category
      return tokens.every(
        (token) =>
          e.name.toLowerCase().includes(token) ||
          e.equipment.toLowerCase().includes(token) ||
          e.muscleGroup.toLowerCase().includes(token) ||
          (e.secondaryMuscles && e.secondaryMuscles.some((m) => m.toLowerCase().includes(token))) ||
          e.category.toLowerCase().includes(token) ||
          e.id.toLowerCase().includes(token)
      );
    });
  }, [resolvedExercise, swapSearchQuery, swapMuscleFilter, swapEquipmentFilter]);

  return (
    <SwipeableModalSheet onClose={onClose} maxHeight="90vh">
      {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Smart Exercise Swap</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Targeting {resolvedExercise.muscleGroup} movement patterns & tension
              </p>
            </div>
          </div>
          <button
            id="btn-close-smart-swap"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Current Exercise Banner */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Exercise
            </span>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginTop: 2 }}>
              {resolvedExercise.name}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-volt)', fontWeight: 700 }}>
                {resolvedExercise.muscleGroup}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {resolvedExercise.equipment}
              </span>
            </div>
          </div>
          <ArrowRight size={20} color="var(--text-muted)" />
        </div>

        {/* Reason Selector Chips */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Why do you need a swap?
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {[
              'Equipment is occupied',
              'Joint or shoulder discomfort',
              'Looking for dumbbell alternative',
              'Prefer cable machine tension'
            ].map((r, i) => (
              <button
                key={i}
                className="timer-chip"
                style={{
                  background: reason === r ? 'rgba(0, 229, 255, 0.2)' : undefined,
                  borderColor: reason === r ? 'var(--accent-cyan)' : undefined,
                  color: reason === r ? '#fff' : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setReason(r);
                  fetchSwap(r);
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* AI Result Card */}
        {loading ? (
          <div
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              color: 'var(--accent-cyan)',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 16
            }}
          >
            <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Gemini AI analyzing biomechanics & movement angles...
            </span>
          </div>
        ) : result ? (
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.08) 0%, var(--bg-card) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 16
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--accent-cyan)',
                  letterSpacing: '0.5px'
                }}
              >
                AI Recommended Alternative
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
                {result.alternativeName}
              </div>
              <div style={{ display: 'inline-block', fontSize: '0.75rem', color: 'var(--accent-volt)', fontWeight: 700 }}>
                Equipment: {result.equipment}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              💡 {result.biomechanicsExplanation}
            </p>

            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(255, 184, 0, 0.2)'
              }}
            >
              ⚖️ <strong>Weight Adjustment:</strong> {result.recommendedWeightAdj}
            </div>

            <button
              id="btn-apply-smart-swap"
              className="btn-accent-cyan"
              style={{ width: '100%', marginTop: 4, cursor: 'pointer' }}
              onClick={() => {
                onSelectAlternative(result.alternativeName, result.equipment);
                onClose();
              }}
            >
              <CheckCircle2 size={18} />
              Swap Into Today's Session
            </button>
          </div>
        ) : null}

        {/* Full Library Alternatives Explorer Section */}
        <div style={{ marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <SlidersHorizontal size={14} color="var(--accent-volt)" />
              <span>Browse Full Library ({filteredAlternatives.length} movements)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Showing {Math.min(filteredAlternatives.length, swapDisplayLimit)} of {filteredAlternatives.length}
            </span>
          </div>

          {/* Enhanced Exercise Filter Bar */}
          <ExerciseFilterBar
            searchQuery={swapSearchQuery}
            onSearchChange={setSwapSearchQuery}
            selectedMuscle={swapMuscleFilter}
            onSelectMuscle={setSwapMuscleFilter}
            selectedEquipment={swapEquipmentFilter}
            onSelectEquipment={setSwapEquipmentFilter}
            totalResults={EXERCISE_LIBRARY.length}
            filteredCount={filteredAlternatives.length}
            placeholder="Search swap movements (e.g. lever, incline)..."
            onReset={() => {
              setSwapSearchQuery('');
              setSwapMuscleFilter('All');
              setSwapEquipmentFilter('All Equipment');
            }}
          />

          {/* Exercise List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {filteredAlternatives.slice(0, swapDisplayLimit).map((alt) => (
              <div
                key={alt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  onSelectAlternative(alt.name, alt.equipment);
                  onClose();
                }}
              >
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{alt.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    <span style={{ color: 'var(--accent-volt)', fontWeight: 600 }}>{alt.muscleGroup}</span>
                    <span>•</span>
                    <span>{alt.equipment}</span>
                    <span>•</span>
                    <span>{alt.category}</span>
                    {alt.secondaryMuscles && alt.secondaryMuscles.length > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>+ {alt.secondaryMuscles.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '5px 10px', color: 'var(--accent-cyan)', flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAlternative(alt.name, alt.equipment);
                    onClose();
                  }}
                >
                  Swap In
                </button>
              </div>
            ))}

            {filteredAlternatives.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No movements found matching your filters. Try clearing the search or switching muscle/equipment filters.
              </div>
            )}

            {/* Load More Button if remaining */}
            {filteredAlternatives.length > swapDisplayLimit && (
              <button
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--accent-volt)',
                  border: '1px dashed rgba(0, 245, 155, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 6,
                  cursor: 'pointer'
                }}
                onClick={() => setSwapDisplayLimit((prev) => prev + 50)}
              >
                Load More ({filteredAlternatives.length - swapDisplayLimit} remaining)
              </button>
            )}
          </div>
        </div>
    </SwipeableModalSheet>
  );
};
