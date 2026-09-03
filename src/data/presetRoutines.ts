import type { Routine } from '../types/gym';

export const PRESET_ROUTINES: Routine[] = [
  {
    id: 'routine-monday',
    name: 'Monday: Upper Body A',
    description: 'Incline pressing, vertical pulling, lateral delts, and triceps pushdowns.',
    splitType: 'Upper/Lower',
    weekday: 'Monday',
    dayTag: 'Monday',
    exercises: [
      {
        exerciseId: 'incline-dumbbell-press',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 30,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'cable-bar-lateral-pulldown',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 110,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'dumbbell-lateral-raise',
        defaultSets: 3,
        targetRepRange: [12, 16],
        defaultWeightKg: 12,
        targetRpe: 9,
        restSeconds: 60
      },
      {
        exerciseId: 'cable-triceps-pushdown-vbar',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 50,
        targetRpe: 9,
        restSeconds: 60
      }
    ]
  },
  {
    id: 'routine-tuesday',
    name: 'Tuesday: Lower Body A',
    description: 'Machine core crunches, heavy Smith calf raises, sled hack squats, and dumbbell RDLs.',
    splitType: 'Upper/Lower',
    weekday: 'Tuesday',
    dayTag: 'Tuesday',
    exercises: [
      {
        exerciseId: 'lever-seated-crunch',
        defaultSets: 3,
        targetRepRange: [10, 12],
        defaultWeightKg: 45,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'smith-calf-raise',
        defaultSets: 3,
        targetRepRange: [12, 15],
        defaultWeightKg: 140,
        targetRpe: 9,
        restSeconds: 60
      },
      {
        exerciseId: 'sled-hack-squat',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 140,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'dumbbell-romanian-deadlift',
        defaultSets: 3,
        targetRepRange: [10, 12],
        defaultWeightKg: 32,
        targetRpe: 8.5,
        restSeconds: 60
      }
    ]
  },
  {
    id: 'routine-wednesday',
    name: 'Wednesday: Upper Body B',
    description: 'Single-arm hammer preacher curls, lever chest flyes, V-bar triceps pushdowns, and low seated cable rows.',
    splitType: 'Upper/Lower',
    weekday: 'Wednesday',
    dayTag: 'Wednesday',
    exercises: [
      {
        exerciseId: 'db-one-arm-hammer-preacher-curl',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 18,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'lever-seated-fly',
        defaultSets: 3,
        targetRepRange: [10, 14],
        defaultWeightKg: 93,
        targetRpe: 9,
        restSeconds: 60
      },
      {
        exerciseId: 'cable-triceps-pushdown-vbar',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 54,
        targetRpe: 9,
        restSeconds: 60
      },
      {
        exerciseId: 'cable-low-seated-row',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 80,
        targetRpe: 8.5,
        restSeconds: 60
      }
    ]
  },
  {
    id: 'routine-thursday',
    name: 'Thursday: Lower Body B',
    description: 'Weighted hanging leg-hip raises, Smith calf overload, 45° leg press, and lever lying leg curls.',
    splitType: 'Upper/Lower',
    weekday: 'Thursday',
    dayTag: 'Thursday',
    exercises: [
      {
        exerciseId: 'weighted-hanging-leg-raise',
        defaultSets: 4,
        targetRepRange: [12, 16],
        defaultWeightKg: 10,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'smith-calf-raise',
        defaultSets: 3,
        targetRepRange: [12, 16],
        defaultWeightKg: 150,
        targetRpe: 9,
        restSeconds: 60
      },
      {
        exerciseId: 'sled-45-leg-press',
        defaultSets: 4,
        targetRepRange: [12, 16],
        defaultWeightKg: 200,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'lever-lying-leg-curl',
        defaultSets: 3,
        targetRepRange: [10, 14],
        defaultWeightKg: 55,
        targetRpe: 9,
        restSeconds: 60
      }
    ]
  },
  {
    id: 'routine-friday',
    name: 'Friday: Upper Body C',
    description: 'Dumbbell reverse wrist curls, heavy lateral pulldowns, lever preacher curls, and seated reverse flyes.',
    splitType: 'Upper/Lower',
    weekday: 'Friday',
    dayTag: 'Friday',
    exercises: [
      {
        exerciseId: 'dumbbell-reverse-wrist-curl',
        defaultSets: 3,
        targetRepRange: [12, 16],
        defaultWeightKg: 8,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'cable-bar-lateral-pulldown',
        defaultSets: 3,
        targetRepRange: [8, 12],
        defaultWeightKg: 120,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'lever-preacher-curl',
        defaultSets: 3,
        targetRepRange: [6, 10],
        defaultWeightKg: 50,
        targetRpe: 8.5,
        restSeconds: 60
      },
      {
        exerciseId: 'lever-seated-reverse-fly',
        defaultSets: 3,
        targetRepRange: [10, 14],
        defaultWeightKg: 65,
        targetRpe: 9,
        restSeconds: 60
      }
    ]
  }
];
