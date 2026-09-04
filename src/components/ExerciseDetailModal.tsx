import React from 'react';
import type { Exercise, MuscleGroup } from '../types/gym';
import { X, Play, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { ExerciseMotionPlayer } from './ExerciseMotionPlayer';

interface ExerciseDetailModalProps {
  exercise: Exercise | {
    id?: string;
    exerciseId?: string;
    name: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    equipment?: string;
    category?: 'Compound' | 'Isolation';
    targetRepRange?: [number, number];
    targetRpe?: number;
    instructions?: string;
    tips?: string[];
  };
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose
}) => {
  const muscle = exercise.muscleGroup;
  const isBackMuscle = ['Back', 'Hamstrings', 'Glutes', 'Calves', 'Triceps'].includes(muscle);
  const secondaryMuscles = exercise.secondaryMuscles || [];
  const repRange = exercise.targetRepRange || [8, 12];
  const rpe = exercise.targetRpe || 8;

  // Biomechanical movement cue details based on category and movement pattern
  const getBiomechanicalCue = () => {
    switch (muscle) {
      case 'Chest':
        return {
          movement: 'Horizontal Adduction / Pressing',
          tempo: '3s Eccentric · 1s Deep Pec Stretch · Explosive Press',
          motionType: 'Press / Fly Arc',
          cue: 'Tuck shoulder blades into bench. Drive elbows inward toward sternum rather than just pushing hands.',
          plane: 'Sagittal / Transverse Plane'
        };
      case 'Back':
        return {
          movement: 'Scapular Retraction & Glenohumeral Extension',
          tempo: '2s Pull · 1s Peak Squeeze · 3s Controlled Stretch',
          motionType: 'Row / Pulldown Vector',
          cue: 'Initiate by driving elbows into your hip pockets. Keep chest high and minimize torso momentum.',
          plane: 'Frontal / Sagittal Plane'
        };
      case 'Shoulders':
        return {
          movement: 'Humeral Abduction / Vertical Flexion',
          tempo: '3s Slow Lowering · No Momentum · 1s Top Hold',
          motionType: 'Scaption / Overhead Arc',
          cue: 'Raise in the scapular plane (30° forward of body line). Lead with elbows, not wrists.',
          plane: 'Scapular Plane'
        };
      case 'Quads':
        return {
          movement: 'Knee Extension & Hip Flexion',
          tempo: '3s Controlled Descent · 1s In The Hole · Drive Up',
          motionType: 'Deep Knee Flexion Arc',
          cue: 'Break at knees and hips simultaneously. Track knees in line with second toe and push through whole foot.',
          plane: 'Sagittal Plane'
        };
      case 'Hamstrings':
      case 'Glutes':
        return {
          movement: 'Hip Hinge & Knee Flexion',
          tempo: '3s Stretch Under Load · Push Hips Back · Powerful Hip Extension',
          motionType: 'Posterior Chain Hinge',
          cue: 'Push hips backward as far as possible like closing a car door with your glutes. Feel deep hamstring stretch.',
          plane: 'Sagittal Plane'
        };
      case 'Biceps':
        return {
          movement: 'Elbow Flexion & Supination',
          tempo: '2s Curl · 1s Peak Peak Squeeze · 3s Negative',
          motionType: 'Arc of Elbow Flexion',
          cue: 'Lock elbows tightly to torso. Turn pinkies upward at top for maximum peak biceps contraction.',
          plane: 'Sagittal Plane'
        };
      case 'Triceps':
        return {
          movement: 'Elbow Extension',
          tempo: '3s Controlled Eccentric · Full Lockout Squeeze',
          motionType: 'Linear Elbow Extension',
          cue: 'Keep upper arms motionless. Drive force purely through elbows and lock out triceps completely.',
          plane: 'Sagittal Plane'
        };
      case 'Forearms':
        return {
          movement: 'Wrist Flexion / Extensor & Grip Isometric',
          tempo: '2s Curl · 1s Hard Hold · Controlled Roll',
          motionType: 'Wrist Articulation / Crush Grip',
          cue: 'Isolate wrist movement. Allow fingers to unroll slightly at bottom for extreme stretch on flexors.',
          plane: 'Sagittal Plane'
        };
      case 'Calves':
        return {
          movement: 'Plantar Flexion',
          tempo: '3s Deep Stretch · 2s Hard Stretch Pause · 1s Ball Squeeze',
          motionType: 'Ankle Plantar Flexion',
          cue: 'Pause 2 seconds in the deep stretched bottom position to eliminate Achilles tendon spring bounce.',
          plane: 'Sagittal Plane'
        };
      case 'Abs':
        return {
          movement: 'Spinal Flexion & Anti-Extension',
          tempo: '2s Crunch · 1s Exhale & Squeeze · 3s Negative',
          motionType: 'Spinal Articulation',
          cue: 'Exhale all air at peak contraction. Roll ribcage toward pelvis instead of flexing hip flexors.',
          plane: 'Sagittal Plane'
        };
      default:
        return {
          movement: 'Controlled Dynamic Movement',
          tempo: '3s Eccentric · 1s Stretch · Explosive Lift',
          motionType: 'Full Range of Motion',
          cue: 'Control the weight at all times. Prioritize deep stretch and peak muscular contraction.',
          plane: 'Multi-Planar'
        };
    }
  };

  const biomechanics = getBiomechanicalCue();
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.name + ' exercise form tutorial execution'
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--accent-volt)',
                  background: 'rgba(0, 245, 155, 0.12)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {exercise.muscleGroup}
              </span>
              {exercise.equipment && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {exercise.equipment}
                </span>
              )}
              {exercise.category && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(0, 229, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {exercise.category}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {exercise.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Animated Kinematic Motion Capture Player */}
        <ExerciseMotionPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          muscleGroup={exercise.muscleGroup}
          equipment={exercise.equipment}
          category={exercise.category}
        />

        {/* Biomechanical Kinematics & Cadence Badge Row */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                Kinematic Plane · {isBackMuscle ? 'Posterior Chain' : 'Anterior Vector'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                {biomechanics.movement}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(0, 229, 255, 0.1)',
                  color: 'var(--accent-cyan)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700
                }}
              >
                🎯 {repRange[0]}–{repRange[1]} Reps
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700
                }}
              >
                ⚡ RPE {rpe}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800 }}>
              Hypertrophy Cadence:
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {biomechanics.tempo}
            </span>
          </div>

          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '7px 12px',
              fontSize: '0.78rem',
              color: '#fff',
              borderColor: 'rgba(0, 245, 155, 0.35)',
              background: 'rgba(0, 245, 155, 0.06)',
              textDecoration: 'none',
              marginTop: 4
            }}
          >
            <Play size={13} color="var(--accent-volt)" fill="var(--accent-volt)" />
            <span>Watch 30s Real Video Form Demo ↗</span>
          </a>
        </div>

        {/* Step-by-Step Execution Instructions */}
        {exercise.instructions && (
          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-lg)' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Target size={14} /> Execution Form Protocol
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {exercise.instructions}
            </p>
          </div>
        )}

        {/* Master Mind-Muscle Hypertrophy Cues */}
        <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-lg)' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-volt)',
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} /> Elite Hypertrophy Cues
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} color="var(--accent-volt)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{biomechanics.cue}</span>
            </div>

            {exercise.tips && exercise.tips.map((tip, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={15} color="var(--accent-volt)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Synergist Muscles */}
        {secondaryMuscles.length > 0 && (
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>
              Synergist & Stabilizer Muscles
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {secondaryMuscles.map((sm) => (
                <span
                  key={sm}
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(0, 229, 255, 0.08)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    color: 'var(--accent-cyan)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}
                >
                  {sm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 6 }}
          onClick={onClose}
        >
          Got It, Let's Lift
        </button>
      </div>
    </div>
  );
};
