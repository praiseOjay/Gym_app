import React from 'react';
import type { Exercise, MuscleGroup } from '../types/gym';
import { X, Play, Target, Sparkles, CheckCircle2 } from 'lucide-react';

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

        {/* Visual Biomechanical Demo Graphic */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14, 20, 32, 0.95), rgba(7, 10, 16, 0.95))',
            border: '1px solid rgba(0, 245, 155, 0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              fontSize: '0.65rem',
              fontWeight: 800,
              color: 'var(--accent-volt)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-volt)',
                boxShadow: '0 0 8px var(--accent-volt)'
              }}
            />
            Biomechanical Visualizer
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Animated SVG Target Silhouette */}
            <div
              style={{
                width: 100,
                height: 120,
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0
              }}
            >
              <svg width="84" height="110" viewBox="0 0 100 130">
                <defs>
                  <filter id="voltGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Body Outline Silhouette */}
                <g fill="#1A2233" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5">
                  {/* Head */}
                  <circle cx="50" cy="16" r="9" />
                  {/* Neck */}
                  <rect x="47" y="24" width="6" height="5" />
                  {/* Torso */}
                  <path d="M34 29 L66 29 L60 74 L40 74 Z" />
                  {/* Left Arm */}
                  <path d="M33 29 L23 48 L17 68 L22 70 L28 50 L34 35 Z" />
                  {/* Right Arm */}
                  <path d="M67 29 L77 48 L83 68 L78 70 L72 50 L66 35 Z" />
                  {/* Hips & Legs */}
                  <path d="M40 74 L37 98 L34 122 L44 122 L48 98 L50 78 L52 98 L56 122 L66 122 L63 98 L60 74 Z" />
                </g>

                {/* Highlighted Primary Muscle with Animation */}
                {muscle === 'Chest' && (
                  <path
                    d="M37 34 C43 32, 57 32, 63 34 C64 45, 58 52, 50 52 C42 52, 36 45, 37 34 Z"
                    fill="var(--accent-volt)"
                    filter="url(#voltGlow)"
                    style={{
                      animation: 'pulse 1.8s infinite ease-in-out',
                      transformOrigin: '50px 40px'
                    }}
                  />
                )}

                {muscle === 'Back' && (
                  <path
                    d="M38 32 C45 30, 55 30, 62 32 C65 48, 62 62, 50 62 C38 62, 35 48, 38 32 Z"
                    fill="var(--accent-volt)"
                    filter="url(#voltGlow)"
                    style={{
                      animation: 'pulse 1.8s infinite ease-in-out',
                      transformOrigin: '50px 45px'
                    }}
                  />
                )}

                {muscle === 'Shoulders' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <circle cx="33" cy="33" r="5" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <circle cx="67" cy="33" r="5" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Biceps' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <ellipse cx="27" cy="46" rx="4" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <ellipse cx="73" cy="46" rx="4" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Triceps' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <ellipse cx="25" cy="47" rx="3.5" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <ellipse cx="75" cy="47" rx="3.5" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Forearms' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <rect x="18" y="56" width="5" height="12" rx="2" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <rect x="77" y="56" width="5" height="12" rx="2" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Quads' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <path d="M39 77 C44 77, 47 88, 45 96 C41 96, 37 88, 39 77 Z" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <path d="M61 77 C56 77, 53 88, 55 96 C59 96, 63 88, 61 77 Z" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {(muscle === 'Hamstrings' || muscle === 'Glutes') && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <path d="M39 75 C45 75, 48 88, 45 98 C40 98, 36 88, 39 75 Z" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <path d="M61 75 C55 75, 52 88, 55 98 C60 98, 64 88, 61 75 Z" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Calves' && (
                  <g fill="var(--accent-volt)" filter="url(#voltGlow)">
                    <ellipse cx="37" cy="110" rx="4" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                    <ellipse cx="63" cy="110" rx="4" ry="7" style={{ animation: 'pulse 1.8s infinite ease-in-out' }} />
                  </g>
                )}

                {muscle === 'Abs' && (
                  <rect
                    x="44"
                    y="50"
                    width="12"
                    height="20"
                    rx="2"
                    fill="var(--accent-volt)"
                    filter="url(#voltGlow)"
                    style={{ animation: 'pulse 1.8s infinite ease-in-out' }}
                  />
                )}
              </svg>
            </div>

            {/* Kinetic Biomechanics Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                  Motion Vector · {isBackMuscle ? 'Posterior' : 'Anterior'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                  {biomechanics.movement}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-volt)', textTransform: 'uppercase', fontWeight: 800 }}>
                  Hypertrophy Cadence
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {biomechanics.tempo}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(0, 229, 255, 0.1)',
                    color: 'var(--accent-cyan)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}
                >
                  🎯 {repRange[0]}–{repRange[1]} Reps
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}
                >
                  ⚡ RPE {rpe}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Video Demonstration Link */}
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 10 }}>
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
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: '#fff',
                borderColor: 'rgba(0, 245, 155, 0.4)',
                background: 'rgba(0, 245, 155, 0.08)',
                textDecoration: 'none'
              }}
            >
              <Play size={14} color="var(--accent-volt)" fill="var(--accent-volt)" />
              <span>Watch 30s Form Video Demo ↗</span>
            </a>
          </div>
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
