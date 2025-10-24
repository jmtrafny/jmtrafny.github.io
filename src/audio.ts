/**
 * Audio Management for Thin Chess
 *
 * Handles all game sound effects with preloading and volume control.
 * Gracefully handles errors (missing files, muted browsers, etc.)
 */

// Sound file paths
const SOUNDS = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  draw: '/sounds/draw.mp3',
} as const;

// Audio instances (preloaded)
const audioCache = new Map<string, HTMLAudioElement>();

// Volume control (0.0 to 1.0)
let globalVolume = 0.5;

// Mute state
let isMuted = false;

/**
 * Initialize audio system by preloading all sounds
 */
export function initAudio(): void {
  Object.entries(SOUNDS).forEach(([key, path]) => {
    const audio = new Audio(path);
    audio.volume = globalVolume;
    audio.preload = 'auto';
    audioCache.set(key, audio);
  });

  // Load mute preference from localStorage
  const savedMute = localStorage.getItem('thin-chess-muted');
  if (savedMute !== null) {
    isMuted = savedMute === 'true';
  }
}

/**
 * Play a sound by key
 */
function playSound(key: string): void {
  if (isMuted) return;

  const audio = audioCache.get(key);
  if (!audio) {
    console.warn(`Sound "${key}" not found in cache`);
    return;
  }

  // Clone and play to allow overlapping sounds
  const clone = audio.cloneNode() as HTMLAudioElement;
  clone.volume = globalVolume;

  clone.play().catch((error) => {
    // Silently fail if autoplay is blocked or file is missing
    console.debug(`Could not play sound "${key}":`, error.message);
  });
}

/**
 * Play move sound (piece moving to empty square)
 */
export function playMove(): void {
  playSound('move');
}

/**
 * Play capture sound (piece taking another piece)
 */
export function playCapture(): void {
  playSound('capture');
}

/**
 * Play victory sound (player wins)
 */
export function playVictory(): void {
  playSound('victory');
}

/**
 * Play defeat sound (player loses)
 */
export function playDefeat(): void {
  playSound('defeat');
}

/**
 * Play draw sound (stalemate)
 */
export function playDraw(): void {
  playSound('draw');
}

/**
 * Set global volume (0.0 to 1.0)
 */
export function setVolume(volume: number): void {
  globalVolume = Math.max(0, Math.min(1, volume));
  audioCache.forEach((audio) => {
    audio.volume = globalVolume;
  });
}

/**
 * Get current volume
 */
export function getVolume(): number {
  return globalVolume;
}

/**
 * Toggle mute state
 */
export function toggleMute(): boolean {
  isMuted = !isMuted;
  localStorage.setItem('thin-chess-muted', String(isMuted));
  return isMuted;
}

/**
 * Get current mute state
 */
export function getMuted(): boolean {
  return isMuted;
}

/**
 * Set mute state explicitly
 */
export function setMuted(muted: boolean): void {
  isMuted = muted;
  localStorage.setItem('thin-chess-muted', String(isMuted));
}
