import React, { useState } from 'react';
import { Search, X, Target, Dumbbell, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface ExerciseFilterState {
  searchQuery: string;
  muscleFilter: string;
  equipmentFilter: string;
}

interface ExerciseFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
  selectedEquipment: string;
  onSelectEquipment: (eq: string) => void;
  totalResults: number;
  filteredCount: number;
  onReset?: () => void;
  placeholder?: string;
}

export const MACRO_MUSCLE_OPTIONS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio'
] as const;

export const DETAILED_MUSCLE_GROUPS = [
  { group: 'Upper Body', items: ['Chest', 'Upper Chest', 'Back', 'Shoulders', 'Rear Delts', 'Traps', 'Biceps', 'Triceps', 'Forearms'] },
  { group: 'Lower Body', items: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { group: 'Core & Cardio', items: ['Abs', 'Core', 'Cardio'] }
];

export const EQUIPMENT_OPTIONS = [
  'All Equipment',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Smith Machine',
  'Bodyweight',
  'Kettlebell',
  'Cardio Machine',
  'Bands & Other'
];

export const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedMuscle,
  onSelectMuscle,
  selectedEquipment,
  onSelectEquipment,
  totalResults,
  filteredCount,
  onReset,
  placeholder
}) => {
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'muscle' | 'equipment'>('none');

  const isMuscleFiltered = selectedMuscle !== 'All';
  const isEquipmentFiltered = selectedEquipment !== 'All Equipment';
  const hasActiveFilters = isMuscleFiltered || isEquipmentFiltered || Boolean(searchQuery);

  const handleToggleDrawer = (drawer: 'muscle' | 'equipment') => {
    triggerHaptic('light');
    setActiveDrawer((prev) => (prev === drawer ? 'none' : drawer));
  };

  const handleSelectMuscleOption = (m: string) => {
    triggerHaptic('light');
    onSelectMuscle(m);
    setActiveDrawer('none');
  };

  const handleSelectEquipmentOption = (eq: string) => {
    triggerHaptic('light');
    onSelectEquipment(eq);
    setActiveDrawer('none');
  };

  const handleResetFilters = () => {
    triggerHaptic('medium');
    onSearchChange('');
    onSelectMuscle('All');
    onSelectEquipment('All Equipment');
    setActiveDrawer('none');
    if (onReset) onReset();
  };

  return (
    <div
      data-no-swipe="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 8,
        touchAction: 'pan-y'
      }}
    >
      {/* 1. Search Bar with Instant Clear */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          color="var(--text-muted)"
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder={placeholder || "Search 1,500+ exercises by name or equipment..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 36px 10px 36px',
            color: '#fff',
            fontSize: '0.86rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onSearchChange('');
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* 2. Quick One-Tap Macro Muscle Pills (No scrolling needed, wraps cleanly) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center'
        }}
      >
        {MACRO_MUSCLE_OPTIONS.map((m) => {
          const isSelected = selectedMuscle === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectMuscleOption(m)}
              style={{
                flex: '1 0 auto',
                minWidth: 'fit-content',
                background: isSelected ? 'var(--accent-volt)' : 'var(--bg-card)',
                color: isSelected ? '#050D0A' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 11px',
                fontSize: '0.73rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 10px rgba(0, 245, 155, 0.3)' : 'none'
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* 3. Dropdown Selector Pills Row (Muscle & Equipment) */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Muscle Selector Button */}
        <button
          type="button"
          onClick={() => handleToggleDrawer('muscle')}
          style={{
            flex: 1,
            background: isMuscleFiltered ? 'rgba(0, 245, 155, 0.12)' : 'var(--bg-surface)',
            border: isMuscleFiltered ? '1px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            cursor: 'pointer',
            color: isMuscleFiltered ? 'var(--accent-volt)' : 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: isMuscleFiltered ? 800 : 600,
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            <Target size={13} color={isMuscleFiltered ? 'var(--accent-volt)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMuscleFiltered ? selectedMuscle : 'All Target Muscles'}
            </span>
          </div>
          {activeDrawer === 'muscle' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Equipment Selector Button */}
        <button
          type="button"
          onClick={() => handleToggleDrawer('equipment')}
          style={{
            flex: 1,
            background: isEquipmentFiltered ? 'rgba(0, 229, 255, 0.12)' : 'var(--bg-surface)',
            border: isEquipmentFiltered ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            cursor: 'pointer',
            color: isEquipmentFiltered ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: isEquipmentFiltered ? 800 : 600,
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            <Dumbbell size={13} color={isEquipmentFiltered ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEquipmentFiltered ? selectedEquipment : 'All Equipment'}
            </span>
          </div>
          {activeDrawer === 'equipment' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Quick Reset Button if filtered */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '7px 10px',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            title="Reset filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 4. Expandable Muscle Selection Grid (No scrolling needed!) */}
      {activeDrawer === 'muscle' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'fadeIn 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Target Muscle
            </span>
            <button
              type="button"
              onClick={() => handleSelectMuscleOption('All')}
              style={{
                background: selectedMuscle === 'All' ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedMuscle === 'All' ? '#050D0A' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset to All Muscles
            </button>
          </div>

          {DETAILED_MUSCLE_GROUPS.map((section) => (
            <div key={section.group}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 5 }}>
                {section.group}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: 5
                }}
              >
                {section.items.map((m) => {
                  const isSelected = selectedMuscle === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMuscleOption(m)}
                      style={{
                        background: isSelected ? 'var(--accent-volt)' : 'var(--bg-surface)',
                        color: isSelected ? '#050D0A' : '#fff',
                        border: isSelected ? '1px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '7px 4px',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Expandable Equipment Selection Grid */}
      {activeDrawer === 'equipment' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'fadeIn 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Equipment
            </span>
            <button
              type="button"
              onClick={() => handleSelectEquipmentOption('All Equipment')}
              style={{
                background: selectedEquipment === 'All Equipment' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedEquipment === 'All Equipment' ? '#050D0A' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset to All Equipment
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 6
            }}
          >
            {EQUIPMENT_OPTIONS.map((eq) => {
              const isSelected = selectedEquipment === eq;
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => handleSelectEquipmentOption(eq)}
                  style={{
                    background: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'var(--bg-surface)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 6px',
                    fontSize: '0.73rem',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {eq}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Results Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: '#fff' }}>{filteredCount}</strong> of {totalResults} exercises
        </div>
        {(isMuscleFiltered || isEquipmentFiltered) && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {isMuscleFiltered && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: 'var(--accent-volt)',
                  background: 'rgba(0, 245, 155, 0.12)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {selectedMuscle}
              </span>
            )}
            {isEquipmentFiltered && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0, 229, 255, 0.12)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {selectedEquipment}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
