// Pure game logic — no DOM access, so this module is unit-testable in isolation.

const TRAILING_PUNCT_RE = /[.,!?]+$/;

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function stripTrailingPunct(word) {
  return word.replace(TRAILING_PUNCT_RE, '');
}

function normalizeSentence(str) {
  return stripTrailingPunct(str.trim()).toLowerCase();
}

export function isAnswerCorrect(userTokens, correctTokens) {
  if (userTokens.length === 0) return false;
  return normalizeSentence(userTokens.join(' ')) === normalizeSentence(correctTokens.join(' '));
}

export function compareTokens(userTokens, correctTokens) {
  const maxLen = Math.max(userTokens.length, correctTokens.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    const correctWord = correctTokens[i] || '';
    const userWord = userTokens[i];
    const isMatch = !!userWord && !!correctWord &&
      stripTrailingPunct(userWord).toLowerCase() === stripTrailingPunct(correctWord).toLowerCase();
    result.push({ word: correctWord, isMatch });
  }
  return result;
}

export function comboPoints(comboLevel) {
  const base = 10;
  const bonus = Math.floor(Math.pow(comboLevel, 1.5) * 3);
  return base + bonus;
}

// Case-insensitive dedupe, keeping the first-seen casing as the display form.
export function buildVocabPool(sentences) {
  const seen = new Map();
  for (const s of sentences) {
    for (const rawWord of s.k) {
      const word = stripTrailingPunct(rawWord);
      if (!word) continue;
      const key = word.toLowerCase();
      if (!seen.has(key)) seen.set(key, word);
    }
  }
  return Array.from(seen.values());
}

export function pickDistractors(vocabPool, correctTokens, count) {
  const correctLower = new Set(correctTokens.map(w => stripTrailingPunct(w).toLowerCase()));
  const candidates = shuffle(vocabPool.slice()).filter(w => !correctLower.has(w.toLowerCase()));
  return candidates.slice(0, count);
}
