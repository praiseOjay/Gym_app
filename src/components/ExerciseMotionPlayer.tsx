import React, { useState, useEffect } from 'react';
import { Play, Pause, Eye, Gauge } from 'lucide-react';
import type { MuscleGroup } from '../types/gym';

interface ExerciseMotionPlayerProps {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  category?: 'Compound' | 'Isolation';
}

type MotionPattern =
  | 'bench_press'
  | 'incline_press'
  | 'pec_fly'
  | 'squat'
  | 'lat_pulldown'
  | 'row'
  | 'overhead_press'
  | 'lateral_raise'
  | 'deadlift_rdl'
  | 'biceps_curl'
  | 'triceps_extension'
  | 'wrist_curl'
  | 'calf_raise'
  | 'ab_crunch';

export const ExerciseMotionPlayer: React.FC<ExerciseMotionPlayerProps> = ({
  exerciseName,
  muscleGroup,
  equipment = 'Barbell'
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showBarPath, setShowBarPath] = useState(true);
  const [activePhase, setActivePhase] = useState<'eccentric' | 'stretch' | 'concentric'>('eccentric');

  // Determine pattern from exercise name & muscle group
  const getPattern = (): MotionPattern => {
    const name = exerciseName.toLowerCase();
    if (name.includes('incline')) return 'incline_press';
    if (name.includes('fly') || name.includes('pec deck') || name.includes('cable crossover')) return 'pec_fly';
    if (name.includes('press') && (muscleGroup === 'Chest' || name.includes('bench') || name.includes('dip'))) return 'bench_press';
    if (name.includes('press') && (muscleGroup === 'Shoulders' || name.includes('overhead') || name.includes('military'))) return 'overhead_press';
    if (name.includes('lateral raise') || name.includes('lu raise')) return 'lateral_raise';
    if (name.includes('pulldown') || name.includes('pullup') || name.includes('chin-up')) return 'lat_pulldown';
    if (name.includes('row') || name.includes('face pull') || name.includes('pullover')) return 'row';
    if (name.includes('squat') || name.includes('leg press') || name.includes('lunge')) return 'squat';
    if (name.includes('rdl') || name.includes('deadlift') || name.includes('hip thrust') || name.includes('leg curl')) return 'deadlift_rdl';
    if (name.includes('wrist curl') || name.includes('farmer') || name.includes('hang') || name.includes('pinch') || muscleGroup === 'Forearms') return 'wrist_curl';
    if (name.includes('calf') || muscleGroup === 'Calves') return 'calf_raise';
    if (muscleGroup === 'Biceps' || name.includes('curl')) return 'biceps_curl';
    if (muscleGroup === 'Triceps' || name.includes('extension') || name.includes('pushdown') || name.includes('skull')) return 'triceps_extension';
    if (muscleGroup === 'Abs' || name.includes('crunch') || name.includes('leg raise')) return 'ab_crunch';
    return 'bench_press';
  };

  const pattern = getPattern();

  // Phase ticker synced with loop
  useEffect(() => {
    if (!isPlaying) return;
    let count = 0;
    const interval = setInterval(() => {
      count = (count + 0.1 * playbackSpeed) % 4.0;
      if (count < 2.0) {
        setActivePhase('eccentric');
      } else if (count < 2.6) {
        setActivePhase('stretch');
      } else {
        setActivePhase('concentric');
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const animDuration = `${3.6 / playbackSpeed}s`;

  return (
    <div className="motion-player-container">
      {/* Top HUD bar */}
      <div className="motion-hud-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="live-indicator-dot" />
          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--accent-volt)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Kinematic Motion Capture
          </span>
        </div>

        {/* Phase Pill */}
        <div
          className={`motion-phase-pill ${activePhase}`}
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {activePhase === 'eccentric' && '📉 Eccentric (Lower)'}
          {activePhase === 'stretch' && '⏸️ Lengthened Stretch'}
          {activePhase === 'concentric' && '📈 Concentric (Drive)'}
        </div>
      </div>

      {/* Main Kinematic Animation Stage */}
      <div className="motion-stage">
        <svg
          viewBox="0 0 320 200"
          className="motion-svg"
          style={{
            animationPlayState: isPlaying ? 'running' : 'paused'
          }}
        >
          <defs>
            <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 245, 155, 0.15)" />
              <stop offset="100%" stopColor="rgba(10, 13, 20, 0)" />
            </radialGradient>
            <linearGradient id="metalBar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8A99AD" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#4A5568" />
            </linearGradient>
            <linearGradient id="voltPulse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F59B" />
              <stop offset="100%" stopColor="#00D285" />
            </linearGradient>
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stage floor grid & ambient back-lighting */}
          <ellipse cx="160" cy="175" rx="140" ry="18" fill="url(#stageGlow)" />
          <line x1="20" y1="180" x2="300" y2="180" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" />
          <line x1="60" y1="188" x2="260" y2="188" stroke="rgba(0, 245, 155, 0.12)" strokeWidth="1" strokeDasharray="8 4" />

          {/* ========================================================= */}
          {/* PATTERN 1: BENCH PRESS (Flat & Incline) */}
          {/* ========================================================= */}
          {(pattern === 'bench_press' || pattern === 'incline_press') && (
            <g className="bench-scene" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
              {/* Gym Bench */}
              <g stroke="#2D3748" strokeWidth="3" fill="#1A202C">
                {/* Bench Stand Posts */}
                <line x1="70" y1="130" x2="70" y2="180" />
                <line x1="210" y1="130" x2="210" y2="180" />
                <line x1="60" y1="180" x2="220" y2="180" />
                {/* Upright Barbell Rack Pegs */}
                <line x1="85" y1="90" x2="85" y2="180" stroke="#4A5568" strokeWidth="4" />
                <path d="M80 88 L85 92 L95 88" fill="none" stroke="#718096" strokeWidth="3" />
                {/* Bench Pad */}
                <rect
                  x="60"
                  y={pattern === 'incline_press' ? '105' : '122'}
                  width="160"
                  height="14"
                  rx="6"
                  fill="#0F141F"
                  stroke="rgba(0, 229, 255, 0.3)"
                  strokeWidth="2"
                  transform={pattern === 'incline_press' ? 'rotate(-25 140 125)' : undefined}
                />
              </g>

              {/* Dotted Bar Path Trajectory (Cyan) */}
              {showBarPath && (
                <path
                  d="M142 58 L142 108"
                  stroke="rgba(0, 229, 255, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Lifter Body on Bench */}
              <g className="lifter-torso">
                {/* Head resting on pad */}
                <circle cx="82" cy={pattern === 'incline_press' ? '92' : '118'} r="11" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />
                {/* Torso with arched ribcage */}
                <path
                  d={
                    pattern === 'incline_press'
                      ? "M94 100 L156 126 L175 145 Z"
                      : "M94 122 C120 114, 145 114, 168 126 L185 142 Z"
                  }
                  fill="#182234"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Glutes & Bent Legs */}
                <path d="M168 126 L205 140 L212 180 L226 180" fill="none" stroke="#2D3748" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

                {/* Chest Muscle Belly (Pulsing / Contracting with Neon Volt) */}
                <path
                  d={
                    pattern === 'incline_press'
                      ? "M118 108 C130 102, 145 112, 140 120 Z"
                      : "M118 116 C134 110, 148 112, 144 124 Z"
                  }
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  className="muscle-glow-chest"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              </g>

              {/* Moving Arms & Barbell Assembly */}
              <g
                className="animated-bench-arms"
                style={{
                  animation: `benchPressMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: pattern === 'incline_press' ? '122px 108px' : '122px 120px'
                }}
              >
                {/* Upper Arm (Humerus) */}
                <line x1="122" y1="120" x2="135" y2="92" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" />
                {/* Forearm (Radius & Ulna tracking vertical) */}
                <line x1="135" y1="92" x2="142" y2="58" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

                {/* Hands Gripping Bar */}
                <circle cx="142" cy="58" r="4.5" fill="#E2E8F0" />

                {/* Barbell Bar (Metal) */}
                <rect x="50" y="55" width="180" height="6" rx="2" fill="url(#metalBar)" stroke="#1A202C" strokeWidth="1" />
                {/* Left & Right Bumper Plates (Competition Red 25kg & Blue 20kg) */}
                <rect x="62" y="32" width="9" height="52" rx="3" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
                <rect x="73" y="38" width="7" height="40" rx="2" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1" />
                <rect x="206" y="38" width="7" height="40" rx="2" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1" />
                <rect x="215" y="32" width="9" height="52" rx="3" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 2: SQUAT / LEG PRESS */}
          {/* ========================================================= */}
          {pattern === 'squat' && (
            <g className="squat-scene">
              {/* Power Rack Vertical Uprights */}
              <line x1="80" y1="20" x2="80" y2="180" stroke="#2D3748" strokeWidth="4" />
              <line x1="240" y1="20" x2="240" y2="180" stroke="#2D3748" strokeWidth="4" />
              {/* Safety Spotter Pins */}
              <line x1="80" y1="125" x2="240" y2="125" stroke="#4A5568" strokeWidth="2" strokeDasharray="4 4" />

              {/* Bar Path Vertical Indicator */}
              {showBarPath && (
                <path d="M152 48 L152 118" stroke="rgba(0, 229, 255, 0.6)" strokeWidth="2" strokeDasharray="3 3" />
              )}

              {/* Lifter Performing Squat */}
              <g
                className="animated-squat-lifter"
                style={{
                  animation: `squatMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '155px 180px'
                }}
              >
                {/* Feet Planted on Floor */}
                <ellipse cx="140" cy="180" rx="10" ry="3" fill="#334155" />
                <ellipse cx="170" cy="180" rx="10" ry="3" fill="#334155" />

                {/* Shins & Calves */}
                <line x1="140" y1="180" x2="135" y2="140" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                <line x1="170" y1="180" x2="175" y2="140" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />

                {/* Thighs & Quads (Pulsing Volt) */}
                <line x1="135" y1="140" x2="148" y2="100" stroke="#2D3748" strokeWidth="12" strokeLinecap="round" />
                <line x1="175" y1="140" x2="162" y2="100" stroke="#2D3748" strokeWidth="12" strokeLinecap="round" />

                {/* Quad Muscle Activation Highlight */}
                <path
                  d="M132 135 L144 105 L152 108 L140 138 Z"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />

                {/* Torso & Head */}
                <path d="M148 100 L158 52 L152 48 Z" stroke="#334155" strokeWidth="14" strokeLinecap="round" />
                <circle cx="152" cy="34" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />

                {/* Arms Supporting Bar */}
                <path d="M152 50 L140 60 L148 48" fill="none" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Barbell on Traps */}
                <rect x="70" y="44" width="165" height="7" rx="2" fill="url(#metalBar)" stroke="#0F172A" strokeWidth="1" />
                {/* Big Red Bumper Plates */}
                <rect x="78" y="20" width="10" height="55" rx="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
                <rect x="90" y="24" width="8" height="47" rx="2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
                <rect x="207" y="24" width="8" height="47" rx="2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
                <rect x="217" y="20" width="10" height="55" rx="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 3: BICEPS CURL / ARMS */}
          {/* ========================================================= */}
          {pattern === 'biceps_curl' && (
            <g className="bicep-scene">
              {/* Lifter Standing Profile */}
              <g stroke="#1E293B" strokeWidth="2" fill="#182234">
                {/* Legs & Torso */}
                <line x1="140" y1="180" x2="145" y2="120" stroke="#1E293B" strokeWidth="9" strokeLinecap="round" />
                <line x1="160" y1="180" x2="155" y2="120" stroke="#1E293B" strokeWidth="9" strokeLinecap="round" />
                <path d="M140 120 L145 65 L160 65 L160 120 Z" fill="#182234" stroke="#334155" strokeWidth="2" />
                <circle cx="152" cy="48" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />
              </g>

              {/* Upper Arm (Stationary Pinned to Torso) */}
              <line x1="156" y1="70" x2="156" y2="110" stroke="#2D3748" strokeWidth="10" strokeLinecap="round" />

              {/* Biceps Muscle Belly with Animated Peak Contraction Bulge */}
              <ellipse
                cx="152"
                cy="90"
                rx="6"
                ry="10"
                fill="url(#voltPulse)"
                filter="url(#neonGlow)"
                style={{
                  animation: `bicepBulge ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />

              {/* Dotted Arm Flexion Arc */}
              {showBarPath && (
                <path
                  d="M156 150 A42 42 0 0 1 128 92"
                  fill="none"
                  stroke="rgba(0, 229, 255, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Animated Forearm & Dumbbell Rotating at Elbow Pivot */}
              <g
                className="animated-forearm-curl"
                style={{
                  animation: `bicepCurlMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '156px 110px'
                }}
              >
                {/* Forearm */}
                <line x1="156" y1="110" x2="156" y2="150" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
                {/* Hand Gripping Weight */}
                <circle cx="156" cy="150" r="5" fill="#E2E8F0" />

                {/* Dumbbell / Barbell Weight */}
                {equipment === 'Barbell' ? (
                  <g>
                    <rect x="105" y="147" width="102" height="6" rx="2" fill="url(#metalBar)" stroke="#0F172A" strokeWidth="1" />
                    <rect x="115" y="132" width="8" height="36" rx="2" fill="#3B82F6" />
                    <rect x="187" y="132" width="8" height="36" rx="2" fill="#3B82F6" />
                  </g>
                ) : (
                  <g>
                    <rect x="142" y="147" width="28" height="6" rx="2" fill="url(#metalBar)" />
                    <rect x="138" y="138" width="6" height="24" rx="2" fill="#3B82F6" />
                    <rect x="168" y="138" width="6" height="24" rx="2" fill="#3B82F6" />
                  </g>
                )}
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 4: FOREARMS / WRIST CURLS / CARRIES */}
          {/* ========================================================= */}
          {pattern === 'wrist_curl' && (
            <g className="forearm-scene">
              {/* Flat Support Bench */}
              <rect x="50" y="125" width="160" height="12" rx="4" fill="#131B2B" stroke="#2D3748" strokeWidth="2" />
              <line x1="80" y1="137" x2="80" y2="180" stroke="#334155" strokeWidth="4" />
              <line x1="180" y1="137" x2="180" y2="180" stroke="#334155" strokeWidth="4" />

              {/* Forearm resting securely flat on pad */}
              <rect x="75" y="112" width="105" height="13" rx="5" fill="#1E293B" stroke="#334155" strokeWidth="2" />

              {/* Glowing Forearm Flexor Muscle Belly */}
              <rect
                x="85"
                y="113"
                width="80"
                height="11"
                rx="4"
                fill="url(#voltPulse)"
                filter="url(#neonGlow)"
                style={{
                  animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />

              {/* Dotted Wrist Range of Motion Arc */}
              {showBarPath && (
                <path
                  d="M185 145 C195 135, 195 105, 185 92"
                  fill="none"
                  stroke="rgba(0, 229, 255, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Animated Wrist Joint & Loaded Barbell */}
              <g
                style={{
                  animation: `wristCurlMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '175px 120px'
                }}
              >
                {/* Hand / Wrist Articulation */}
                <line x1="175" y1="120" x2="195" y2="120" stroke="#4A5568" strokeWidth="8" strokeLinecap="round" />
                <circle cx="195" cy="120" r="5" fill="#CBD5E1" />

                {/* Barbell / Dumbbell Being Curled by Wrists */}
                <rect x="145" y="116" width="100" height="7" rx="2" fill="url(#metalBar)" stroke="#0F172A" strokeWidth="1" />
                <rect x="155" y="98" width="9" height="42" rx="2" fill="#EAB308" />
                <rect x="225" y="98" width="9" height="42" rx="2" fill="#EAB308" />
              </g>

              {/* Forearm isolation label */}
              <text x="125" y="102" fill="var(--accent-volt)" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">
                FOREARM FLEXORS & GRIP
              </text>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 5: LAT PULLDOWN / BACK ROWS */}
          {/* ========================================================= */}
          {(pattern === 'lat_pulldown' || pattern === 'row') && (
            <g className="pulldown-scene">
              {/* Cable Pulley Machine Upright */}
              <line x1="160" y1="10" x2="160" y2="35" stroke="#4A5568" strokeWidth="4" />
              <circle cx="160" cy="35" r="7" fill="#1E293B" stroke="#00E5FF" strokeWidth="2" />
              <line x1="160" y1="180" x2="160" y2="130" stroke="#334155" strokeWidth="6" />

              {/* Cable Line */}
              <line x1="160" y1="35" x2="160" y2="60" stroke="#CBD5E1" strokeWidth="2" />

              {/* Dotted Trajectory */}
              {showBarPath && (
                <path d="M160 55 L160 110" stroke="rgba(0, 229, 255, 0.6)" strokeWidth="2" strokeDasharray="3 3" />
              )}

              {/* Seated Lifter with Highlighted Lats */}
              <g className="pulldown-lifter">
                <rect x="135" y="145" width="50" height="8" rx="3" fill="#0F172A" />
                <path d="M152 145 L155 95 L165 95 L168 145 Z" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                <circle cx="160" cy="78" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />

                {/* V-Taper Latissimus Dorsi Muscle Highlight */}
                <path
                  d="M144 100 C154 90, 166 90, 176 100 L168 135 L152 135 Z"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              </g>

              {/* Animated Arms & Wide Lat Pulldown Bar */}
              <g
                style={{
                  animation: `latPulldownMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '160px 35px'
                }}
              >
                {/* Wide Angled Lat Bar */}
                <path d="M85 58 L110 50 L210 50 L235 58" fill="none" stroke="url(#metalBar)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Center Pulley Ring */}
                <circle cx="160" cy="50" r="4" fill="#00E5FF" />

                {/* Hands and Arms Pulling Down */}
                <circle cx="105" cy="52" r="4" fill="#E2E8F0" />
                <circle cx="215" cy="52" r="4" fill="#E2E8F0" />
                <line x1="148" y1="92" x2="105" y2="52" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="172" y1="92" x2="215" y2="52" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 6: SHOULDERS / OVERHEAD / LATERAL RAISES */}
          {/* ========================================================= */}
          {(pattern === 'overhead_press' || pattern === 'lateral_raise') && (
            <g className="shoulder-scene">
              {/* Standing Lifter Front View */}
              <g stroke="#1E293B" strokeWidth="2" fill="#182234">
                <line x1="145" y1="180" x2="150" y2="125" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                <line x1="175" y1="180" x2="170" y2="125" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                <path d="M140 125 L145 70 L175 70 L180 125 Z" fill="#182234" stroke="#334155" strokeWidth="2" />
                <circle cx="160" cy="52" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />
              </g>

              {/* Glowing Shoulder Deltoid Caps */}
              <circle
                cx="140"
                cy="74"
                r="7"
                fill="url(#voltPulse)"
                filter="url(#neonGlow)"
                style={{
                  animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />
              <circle
                cx="180"
                cy="74"
                r="7"
                fill="url(#voltPulse)"
                filter="url(#neonGlow)"
                style={{
                  animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />

              {/* Dotted Motion Arcs */}
              {showBarPath && (
                <g stroke="rgba(0, 229, 255, 0.6)" strokeWidth="2" strokeDasharray="3 3" fill="none">
                  {pattern === 'lateral_raise' ? (
                    <>
                      <path d="M130 145 C100 140, 80 100, 80 75" />
                      <path d="M190 145 C220 140, 240 100, 240 75" />
                    </>
                  ) : (
                    <path d="M160 68 L160 22" />
                  )}
                </g>
              )}

              {/* Animated Raise / Press Arms */}
              {pattern === 'lateral_raise' ? (
                <g
                  style={{
                    animation: `lateralRaiseMotion ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused',
                    transformOrigin: '160px 74px'
                  }}
                >
                  <line x1="140" y1="74" x2="90" y2="140" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                  <line x1="180" y1="74" x2="230" y2="140" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="90" cy="140" r="5" fill="#3B82F6" />
                  <circle cx="230" cy="140" r="5" fill="#3B82F6" />
                </g>
              ) : (
                <g
                  style={{
                    animation: `overheadPressMotion ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused',
                    transformOrigin: '160px 70px'
                  }}
                >
                  <rect x="80" y="65" width="160" height="6" rx="2" fill="url(#metalBar)" />
                  <rect x="88" y="45" width="8" height="46" rx="2" fill="#EF4444" />
                  <rect x="224" y="45" width="8" height="46" rx="2" fill="#EF4444" />
                </g>
              )}
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 7: POSTERIOR CHAIN / DEADLIFT / RDL / HAMSTRINGS */}
          {/* ========================================================= */}
          {pattern === 'deadlift_rdl' && (
            <g className="rdl-scene">
              {showBarPath && (
                <path d="M175 110 L175 160" stroke="rgba(0, 229, 255, 0.6)" strokeWidth="2" strokeDasharray="3 3" />
              )}

              {/* Animated Hip Hinge Body */}
              <g
                style={{
                  animation: `rdlHingeMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '145px 180px'
                }}
              >
                {/* Legs with Soft Knee Bend */}
                <line x1="140" y1="180" x2="135" y2="145" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                <line x1="135" y1="145" x2="150" y2="115" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />

                {/* Glowing Hamstrings & Glutes */}
                <path
                  d="M130 145 C132 130, 142 120, 148 115 L144 145 Z"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />

                {/* Torso Hinged at Hips */}
                <line x1="150" y1="115" x2="175" y2="80" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                <circle cx="180" cy="70" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />

                {/* Arms Hanging Vertically Tracking Bar Close to Shins */}
                <line x1="170" y1="88" x2="175" y2="135" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" />

                {/* Barbell */}
                <rect x="125" y="132" width="100" height="6" rx="2" fill="url(#metalBar)" />
                <circle cx="135" cy="135" r="18" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
                <circle cx="215" cy="135" r="18" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 8: TRICEPS / PUSHDOWNS / EXTENSIONS */}
          {/* ========================================================= */}
          {pattern === 'triceps_extension' && (
            <g className="tricep-scene">
              <line x1="160" y1="10" x2="160" y2="35" stroke="#4A5568" strokeWidth="4" />
              <circle cx="160" cy="35" r="7" fill="#1E293B" stroke="#00E5FF" strokeWidth="2" />

              {/* Standing Lifter Side Angle */}
              <line x1="135" y1="180" x2="138" y2="120" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
              <line x1="155" y1="180" x2="152" y2="120" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
              <path d="M135 120 L138 65 L154 65 L150 120 Z" fill="#182234" stroke="#334155" strokeWidth="2" />
              <circle cx="145" cy="50" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />

              {/* Upper Arm Pinned to Ribcage */}
              <line x1="145" y1="70" x2="148" y2="105" stroke="#2D3748" strokeWidth="10" strokeLinecap="round" />

              {/* Glowing Triceps Horseshoe Head */}
              <ellipse
                cx="142"
                cy="86"
                rx="5"
                ry="9"
                fill="url(#voltPulse)"
                filter="url(#neonGlow)"
                style={{
                  animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />

              {/* Dotted Pushdown Trajectory */}
              {showBarPath && (
                <path d="M175 105 A35 35 0 0 1 155 145" fill="none" stroke="rgba(0, 229, 255, 0.6)" strokeWidth="2" strokeDasharray="3 3" />
              )}

              {/* Animated Forearm Extension */}
              <g
                style={{
                  animation: `tricepPushdownMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '148px 105px'
                }}
              >
                <line x1="148" y1="105" x2="175" y2="105" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <circle cx="175" cy="105" r="4.5" fill="#E2E8F0" />
                {/* Cable Attachment Handle */}
                <line x1="175" y1="95" x2="175" y2="115" stroke="url(#metalBar)" strokeWidth="4" strokeLinecap="round" />
                <line x1="160" y1="35" x2="175" y2="105" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="2 2" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 9: ABS / CRUNCHES */}
          {/* ========================================================= */}
          {pattern === 'ab_crunch' && (
            <g className="ab-scene">
              <rect x="70" y="160" width="180" height="8" rx="3" fill="#131B2B" />
              <g
                style={{
                  animation: `abCrunchMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '160px 150px'
                }}
              >
                {/* Kneeling Base */}
                <path d="M130 160 L145 135 L160 150" fill="none" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                {/* Spine Rounding Forward */}
                <path d="M160 150 C175 125, 175 105, 150 90" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                <circle cx="145" cy="80" r="10" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />

                {/* Glowing 6-Pack Rectus Abdominis */}
                <rect
                  x="156"
                  y="105"
                  width="12"
                  height="28"
                  rx="3"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* PATTERN 10: CALF RAISES */}
          {/* ========================================================= */}
          {pattern === 'calf_raise' && (
            <g className="calf-scene">
              {/* Raised Step Block */}
              <rect x="120" y="155" width="80" height="25" rx="3" fill="#1E293B" stroke="#334155" strokeWidth="2" />

              {/* Animated Ankle Plantarflexion */}
              <g
                style={{
                  animation: `calfRaiseMotion ${animDuration} infinite ease-in-out`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  transformOrigin: '160px 155px'
                }}
              >
                <line x1="145" y1="155" x2="135" y2="165" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" />
                <line x1="175" y1="155" x2="165" y2="165" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" />

                {/* Shins & Glowing Gastrocnemius / Soleus */}
                <line x1="145" y1="155" x2="150" y2="90" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                <line x1="175" y1="155" x2="170" y2="90" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />

                <ellipse
                  cx="145"
                  cy="110"
                  rx="6"
                  ry="14"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
                <ellipse
                  cx="175"
                  cy="110"
                  rx="6"
                  ry="14"
                  fill="url(#voltPulse)"
                  filter="url(#neonGlow)"
                  style={{
                    animation: `pulseGlow ${animDuration} infinite ease-in-out`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />

                {/* Upper Body */}
                <rect x="145" y="40" width="30" height="50" rx="4" fill="#243046" />
                <circle cx="160" cy="28" r="9" fill="#243046" stroke="#4A5568" strokeWidth="1.5" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Media Player Controls Row */}
      <div className="motion-controls-row">
        {/* Play/Pause Toggle */}
        <button
          className="motion-ctrl-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Animation' : 'Play Animation'}
        >
          {isPlaying ? <Pause size={15} color="#fff" /> : <Play size={15} color="var(--accent-volt)" fill="var(--accent-volt)" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Speed Stepper (0.5x, 1x, 1.5x) */}
        <div className="motion-speed-selector">
          <Gauge size={13} color="var(--text-muted)" />
          {[0.5, 1, 1.5].map((spd) => (
            <button
              key={spd}
              className={`motion-speed-chip ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
              title={`${spd}x Playback Speed`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Bar Path Trajectory Toggle */}
        <button
          className={`motion-ctrl-btn ${showBarPath ? 'active-glow' : ''}`}
          onClick={() => setShowBarPath(!showBarPath)}
          title="Toggle Bar Path Trajectory"
        >
          <Eye size={14} color={showBarPath ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.7rem' }}>Vector</span>
        </button>
      </div>
    </div>
  );
};
