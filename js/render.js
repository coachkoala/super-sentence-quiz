// All DOM writes live here. Functions take the data they need to draw and
// nothing else, so they stay easy to reason about independent of game state.

import { el } from './dom.js';

export function renderHearts(lives, maxLives) {
  el.heartsRow.innerHTML = '';
  for (let i = 0; i < maxLives; i++) {
    const h = document.createElement('span');
    h.className = 'heart' + (i >= lives ? ' lost' : '');
    h.textContent = '❤️';
    el.heartsRow.appendChild(h);
  }
}

export function pulseLostHeart(lives) {
  const hearts = el.heartsRow.children;
  if (hearts[lives]) hearts[lives].classList.add('pulse');
}

export function renderBank(bankState, onPick) {
  el.wordBank.innerHTML = '';
  bankState.forEach((item, i) => {
    const t = document.createElement('div');
    t.className = 'tile' + (item.used ? ' used' : '');
    t.textContent = item.tok;
    t.addEventListener('click', () => onPick(i));
    el.wordBank.appendChild(t);
  });
}

export function renderAnswer(answerTokens, onRemove) {
  el.answerZone.innerHTML = '';
  if (answerTokens.length === 0) {
    el.answerZone.classList.add('empty');
  } else {
    el.answerZone.classList.remove('empty');
    answerTokens.forEach((item) => {
      const s = document.createElement('div');
      s.className = 'slot';
      s.textContent = item.tok;
      s.addEventListener('click', () => onRemove(item));
      el.answerZone.appendChild(s);
    });
  }
}

export function renderComparison(comparison) {
  el.revealCompare.innerHTML = '';
  comparison.forEach(({ word, isMatch }) => {
    const span = document.createElement('span');
    span.className = 'rword ' + (isMatch ? 'match' : 'miss');
    span.textContent = word;
    el.revealCompare.appendChild(span);
  });
}

export function popScore(amount) {
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = '+' + amount;
  el.app.appendChild(pop);
  requestAnimationFrame(() => pop.classList.add('fly'));
  setTimeout(() => pop.remove(), 750);
}

export function showCombo(n) {
  el.comboPill.textContent = '🔥 x' + n;
  el.comboPill.classList.toggle('big', n >= 5);
  el.comboPill.classList.add('show');
}

export function hideCombo() {
  el.comboPill.classList.remove('show', 'big');
}

export function renderScore(score) {
  el.scoreVal.textContent = score;
}

export function renderBest(best) {
  el.bestVal.textContent = best;
}

export function showLoading() {
  el.loadingBox.classList.add('show');
  el.errorBox.classList.remove('show');
}

export function hideLoading() {
  el.loadingBox.classList.remove('show');
}

export function showLoadError(message, onRetry) {
  el.loadingBox.classList.remove('show');
  el.errorBox.classList.add('show');
  el.errorBox.querySelector('.error-message').textContent = message;
  const retryBtn = el.errorBox.querySelector('.error-retry');
  retryBtn.onclick = onRetry;
}
