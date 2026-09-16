import React, { useState, useEffect } from 'react';
import { Dumbbell, Settings, Flame, Sparkles } from 'lucide-react';
import type { UserSettings } from '../types/gym';
import { subscriptionService } from '../services/subscriptionService';

interface HeaderProps {
  settings: UserSettings;
  onToggleUnit: () => void;
  onOpenSettings: () => void;
  prCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleUnit,
  onOpenSettings,
  prCount
}) => {
  const [isPro, setIsPro] = useState(() => subscriptionService.isPro());

  useEffect(() => {
    const unsub = subscriptionService.subscribe((s) => setIsPro(s.isPro));
    return unsub;
  }, []);

  return (
    <header className="header-bar">
      <div className="brand-badge">
        <div className="brand-logo-icon">
          <Dumbbell size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">OVERLOAD AI</div>
          <div className="brand-subtitle">Hypertrophy Coach</div>
        </div>
      </div>

      <div className="header-actions">
        {isPro ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
              color: '#050D0A',
              fontWeight: 900,
              letterSpacing: '0.04em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Overload Pro Active"
          >
            <Sparkles size={11} fill="#050D0A" />
            <span>PRO</span>
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            style={{
              background: 'rgba(0, 245, 155, 0.12)',
              border: '1px solid rgba(0, 245, 155, 0.35)',
              color: 'var(--accent-volt)',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
            title="Upgrade to Overload Pro"
          >
            <Sparkles size={11} />
            <span>PRO</span>
          </button>
        )}

        {prCount > 0 && (
          <div className="pr-badge-gold" title={`${prCount} Personal Records Logged`}>
            <Flame size={13} fill="#261600" />
            <span>{prCount} PRs</span>
          </div>
        )}

        <button
          className="unit-toggle-btn"
          onClick={onToggleUnit}
          title={`Click to switch to ${settings.unit === 'kg' ? 'lbs' : 'kg'}`}
        >
          <span>{settings.unit.toUpperCase()}</span>
        </button>

        <button
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="App & AI Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
