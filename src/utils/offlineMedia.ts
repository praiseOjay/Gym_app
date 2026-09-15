// Offline Media & Cache Manager for Exercise GIFs
// Uses the Cache API to persist high-definition WorkoutX animated GIFs locally.

import { getExerciseVisual } from '../data/exerciseVisualMap';
import type { Routine } from '../types/gym';

const MEDIA_CACHE_NAME = 'overload-ai-media-v3';

/**
 * Preloads and caches a single exercise GIF for offline availability
 */
export async function preloadExerciseGif(exerciseIdOrName: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  const visual = getExerciseVisual(exerciseIdOrName);
  if (!visual?.gifUrl) return false;

  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const existing = await cache.match(visual.gifUrl);
    if (existing) return true;

    // Fetch and store in media cache
    const response = await fetch(visual.gifUrl, { mode: 'cors' });
    if (response.ok || response.type === 'opaque') {
      await cache.put(visual.gifUrl, response);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`Failed to preload offline GIF for ${exerciseIdOrName}:`, err);
    return false;
  }
}

/**
 * Preloads all exercise GIFs for a given training routine in the background
 */
export async function preloadRoutineGifs(routine: Routine): Promise<{ success: number; total: number }> {
  if (!routine?.exercises || routine.exercises.length === 0) {
    return { success: 0, total: 0 };
  }

  let success = 0;
  for (const template of routine.exercises) {
    const ok = await preloadExerciseGif(template.exerciseId);
    if (ok) success++;
  }

  return { success, total: routine.exercises.length };
}

/**
 * Checks if a specific exercise GIF is already saved offline
 */
export async function isExerciseGifCached(exerciseIdOrName: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  const visual = getExerciseVisual(exerciseIdOrName);
  if (!visual?.gifUrl) return false;

  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const match = await cache.match(visual.gifUrl);
    return !!match;
  } catch {
    return false;
  }
}

/**
 * Returns the number of exercise GIFs currently cached offline
 */
export async function getOfflineMediaStats(): Promise<{ cachedCount: number }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cachedCount: 0 };
  }

  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const keys = await cache.keys();
    return { cachedCount: keys.length };
  } catch {
    return { cachedCount: 0 };
  }
}
