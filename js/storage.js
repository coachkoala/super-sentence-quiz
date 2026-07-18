// Best-score persistence via localStorage. Isolated so the storage key/strategy
// can change later (e.g. per-difficulty best scores) without touching game logic.

const BEST_SCORE_KEY = 'ssq:bestScore';
const SOUND_PREF_KEY = 'ssq:soundEnabled';

export function loadBestScore() {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const value = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    // localStorage unavailable (privacy mode, disabled storage, etc).
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Ignore write failures — best score just won't persist this session.
  }
}

export function loadSoundPref() {
  try {
    const raw = localStorage.getItem(SOUND_PREF_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function saveSoundPref(enabled) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore write failures — preference just won't persist this session.
  }
}
