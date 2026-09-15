import type { Exercise } from '../types/gym';

export interface ExerciseFilterOptions {
  searchQuery?: string;
  selectedMuscle?: string;
  selectedEquipment?: string;
  excludeId?: string;
}

/**
 * Filter exercises comprehensively with tokenized search,
 * macro muscle groups, secondary muscle inclusion with primary prioritization,
 * and complete 100% equipment categorization.
 */
export function filterExerciseLibrary(
  library: Exercise[],
  options: ExerciseFilterOptions
): Exercise[] {
  const {
    searchQuery = '',
    selectedMuscle = 'All',
    selectedEquipment = 'All Equipment',
    excludeId
  } = options;

  const q = searchQuery.toLowerCase().trim();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  return library
    .filter((e) => {
      // 1. Exclude specific exercise if requested (e.g. in SmartSwap)
      if (
        excludeId &&
        (e.id.toLowerCase() === excludeId.toLowerCase() ||
          e.name.toLowerCase() === excludeId.toLowerCase())
      ) {
        return false;
      }

      // 2. Muscle Filter
      if (selectedMuscle && selectedMuscle !== 'All') {
        const sm = selectedMuscle.toLowerCase();
        const mg = e.muscleGroup.toLowerCase();
        const sec = (e.secondaryMuscles || []).map((m) => m.toLowerCase());

        let match = false;
        if (sm === 'legs') {
          const legMuscles = ['quads', 'hamstrings', 'glutes', 'calves'];
          match = legMuscles.includes(mg) || sec.some((m) => legMuscles.includes(m));
        } else if (sm === 'arms') {
          const armMuscles = ['biceps', 'triceps', 'forearms'];
          match = armMuscles.includes(mg) || sec.some((m) => armMuscles.includes(m));
        } else if (sm === 'core') {
          match = mg === 'abs' || mg === 'core' || sec.includes('abs') || sec.includes('core');
        } else if (sm === 'back') {
          match = mg === 'back' || mg === 'traps' || sec.includes('back') || sec.includes('traps');
        } else if (sm === 'shoulders') {
          match =
            mg === 'shoulders' ||
            mg === 'rear delts' ||
            mg === 'traps' ||
            sec.includes('shoulders') ||
            sec.includes('rear delts');
        } else if (sm === 'chest') {
          match =
            mg === 'chest' ||
            mg === 'upper chest' ||
            sec.includes('chest') ||
            sec.includes('upper chest');
        } else if (sm === 'cardio') {
          match = mg === 'cardio' || e.equipment === 'Cardio Machine' || sec.includes('cardio');
        } else {
          match = mg === sm || sec.includes(sm);
        }

        if (!match) return false;
      }

      // 3. Equipment Filter
      if (selectedEquipment && selectedEquipment !== 'All Equipment') {
        const eq = selectedEquipment.toLowerCase();
        const exerciseEq = e.equipment.toLowerCase();
        const name = e.name.toLowerCase();

        let match = false;
        if (eq === 'machine') {
          match = exerciseEq === 'machine' || name.includes('lever') || exerciseEq === 'smith machine';
        } else if (eq === 'bands & other' || eq === 'other') {
          match = exerciseEq === 'other' || name.includes('band') || exerciseEq.includes('band');
        } else if (eq === 'cardio machine') {
          match = exerciseEq === 'cardio machine' || e.muscleGroup === 'Cardio';
        } else {
          match = exerciseEq === eq;
        }

        if (!match) return false;
      }

      // 4. Tokenized search across all exercise attributes
      if (tokens.length === 0) return true;

      return tokens.every((token) => {
        return (
          e.name.toLowerCase().includes(token) ||
          e.equipment.toLowerCase().includes(token) ||
          e.muscleGroup.toLowerCase().includes(token) ||
          (e.secondaryMuscles && e.secondaryMuscles.some((m) => m.toLowerCase().includes(token))) ||
          e.category.toLowerCase().includes(token) ||
          e.id.toLowerCase().includes(token)
        );
      });
    })
    .sort((a, b) => {
      // Prioritize primary muscle match over secondary muscle match
      if (selectedMuscle && selectedMuscle !== 'All') {
        const sm = selectedMuscle.toLowerCase();
        const aPrimary = a.muscleGroup.toLowerCase() === sm;
        const bPrimary = b.muscleGroup.toLowerCase() === sm;
        if (aPrimary && !bPrimary) return -1;
        if (!aPrimary && bPrimary) return 1;
      }
      return 0;
    });
}
