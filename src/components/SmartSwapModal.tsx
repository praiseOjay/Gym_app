import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Sparkles, RefreshCw, CheckCircle2, ArrowRight, SlidersHorizontal, Eye } from 'lucide-react';
import type { Exercise } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getSmartExerciseSwap } from '../services/geminiService';
import { SwipeableModalSheet } from './SwipeableModalSheet';
import { ExerciseFilterBar } from './ExerciseFilterBar';
import { filterExerciseLibrary } from '../utils/exerciseFilterUtils';
import { ExerciseDetailModal } from './ExerciseDetailModal';

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

  // Exercise preview before swapping state
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Search & Filtering States for library alternatives
  const [swapSearchQuery, setSwapSearchQuery] = useState('');
  const [swapMuscleFilter, setSwapMuscleFilter] = useState<string>(resolvedExercise.muscleGroup || 'All');
  const [swapEquipmentFilter, setSwapEquipmentFilter] = useState<string>('All Equipment');
  const [swapDisplayLimit, setSwapDisplayLimit] = useState(40);

  // Match AI recommended alternative to library exercise for previewing
  const aiRecommendedExercise = useMemo<Exercise | null>(() => {
    if (!result) return null;
    const nameToMatch = result.alternativeName.toLowerCase().trim();

    // 1. Exact match by name or id
    let matched = EXERCISE_LIBRARY.find(
      (e) => e.name.toLowerCase() === nameToMatch || e.id.toLowerCase() === nameToMatch
    );

    // 2. Substring match
    if (!matched) {
      matched = EXERCISE_LIBRARY.find(
        (e) => e.name.toLowerCase().includes(nameToMatch) || nameToMatch.includes(e.name.toLowerCase())
      );
    }

    if (matched) return matched;

    // Fallback synthesized exercise with AI biomechanics & recommendations
    return {
      id: `swap-${nameToMatch.replace(/[^a-z0-9]/g, '-')}`,
      name: result.alternativeName,
      muscleGroup: resolvedExercise.muscleGroup,
      secondaryMuscles: resolvedExercise.secondaryMuscles,
      equipment: result.equipment || resolvedExercise.equipment,
      category: resolvedExercise.category,
      targetRepRange: resolvedExercise.targetRepRange || [8, 12],
      targetRpe: resolvedExercise.targetRpe || 8,
      instructions: result.biomechanicsExplanation,
      tips: [result.recommendedWeightAdj]
    } as Exercise;
  }, [result, resolvedExercise]);

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
    return filterExerciseLibrary(EXERCISE_LIBRARY, {
      searchQuery: swapSearchQuery,
      selectedMuscle: swapMuscleFilter,
      selectedEquipment: swapEquipmentFilter,
      excludeId: resolvedExercise.id
    });
  }, [resolvedExercise, swapSearchQuery, swapMuscleFilter, swapEquipmentFilter]);

  return (
    <>
      <SwipeableModalSheet onClose={onClose} maxHeight="90vh" handleOnly>
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
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (aiRecommendedExercise) setPreviewExercise(aiRecommendedExercise);
              }}
              title="Click to preview exercise demonstration GIF"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600
                  }}
                >
                  <Eye size={13} /> Tap to preview
                </span>
              </div>
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

            {/* Action buttons: Preview Form & Swap In */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                id="btn-preview-smart-swap"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  borderColor: 'rgba(0, 229, 255, 0.35)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (aiRecommendedExercise) {
                    setPreviewExercise(aiRecommendedExercise);
                  }
                }}
              >
                <Eye size={16} />
                Preview Form
              </button>
              <button
                id="btn-apply-smart-swap"
                className="btn-accent-cyan"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onSelectAlternative(result.alternativeName, result.equipment);
                  onClose();
                }}
              >
                <CheckCircle2 size={18} />
                Swap In Now
              </button>
            </div>
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

          {/* Preview Guide Banner */}
          <div
            style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.22)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.72rem',
              color: 'var(--text-secondary)'
            }}
          >
            <Eye size={13} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span>
              Tap any exercise or <strong style={{ color: 'var(--accent-cyan)' }}>Preview</strong> to view form GIF & cues before swapping.
            </span>
          </div>

          {/* Exercise List */}
          <div
            data-no-swipe="true"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 'calc(90vh - 350px)',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            }}
            onScroll={(e) => {
              const t = e.currentTarget;
              if (t.scrollHeight - t.scrollTop - t.clientHeight < 120) {
                setSwapDisplayLimit((prev) => Math.min(prev + 40, filteredAlternatives.length));
              }
            }}
          >
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
                  setPreviewExercise(alt);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      fontSize: '0.72rem',
                      padding: '5px 8px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewExercise(alt);
                    }}
                    title="Preview exercise animation and cues"
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      fontSize: '0.72rem',
                      padding: '5px 10px',
                      color: 'var(--accent-cyan)',
                      fontWeight: 700,
                      borderColor: 'rgba(0, 229, 255, 0.3)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAlternative(alt.name, alt.equipment);
                      onClose();
                    }}
                  >
                    Swap In
                  </button>
                </div>
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

      {/* Exercise Form & GIF Preview Modal Before Swapping */}
      {previewExercise && (
        <ExerciseDetailModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
          onAddExercise={(ex) => {
            onSelectAlternative(ex.name, ex.equipment || 'Gym Equipment');
            setPreviewExercise(null);
            onClose();
          }}
          actionLabel="Swap into Workout"
          overlayZIndex={130}
        />
      )}
    </>
  );
};

