import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export type NavTab = 'dashboard' | 'workout' | 'routines' | 'analytics' | 'coach';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveWorkout: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  hasActiveWorkout
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workout', label: hasActiveWorkout ? 'Active' : 'Workout', icon: Dumbbell },
    { id: 'routines', label: 'Split', icon: CalendarDays },
    { id: 'analytics', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: 'AI Coach', icon: Sparkles }
  ] as const;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id as NavTab)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="nav-item-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
