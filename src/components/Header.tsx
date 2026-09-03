import React from 'react';
import { Dumbbell, Settings, Flame } from 'lucide-react';
import type { UserSettings } from '../types/gym';

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
