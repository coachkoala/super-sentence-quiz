import { el } from './dom.js';
import * as render from './render.js';
import { shuffle, isAnswerCorrect, compareTokens, comboPoints, buildVocabPool, pickDistractors } from './logic.js';
import { loadBestScore, saveBestScore } from './storage.js';
import { loadSentences } from './dataLoader.js';
import { shareScoreCard } from './share.js';
import * as sound from './sound.js';

const MAX_LIVES = 5;
const LIFE_REGEN_COMBO = 5; // every N-combo streak restores 1 life, up to MAX_LIVES
const AUTO_ADVANCE_DELAY = 900; // ms after a correct answer
const DISTRACTOR_COUNT = 1;

let pool = [];
let vocab = [];
let idx = 0;
let score = 0;
let best = 0;
let combo = 0;
let maxCombo = 0;
let correctCount = 0;
let lives = MAX_LIVES;
let current = null;
let answerTokens = [];
let bankState = [];
let answered = false;
let advanceTimer = null;

async function init() {
  best = loadBestScore();
  render.renderBest(best);
  render.renderHearts(lives, MAX_LIVES);
  renderSoundToggle();

  await bootstrapData();

  el.checkBtn.addEventListener('click', checkAnswer);
  el.nextBtn.addEventListener('click', () => {
    sound.playButtonClick();
    loadNext();
  });
  el.skipBtn.addEventListener('click', () => {
    if (answered) return;
    sound.playButtonClick();
    combo = 0;
    render.hideCombo();
    loadNext();
  });
  el.retryBtn.addEventListener('click', () => {
    sound.playButtonClick();
    resetGame();
  });
  el.shareBtn.addEventListener('click', () => {
    sound.playButtonClick();
    shareScoreCard({
      shareCardEl: el.shareCard,
      hintEl: el.shareHint,
      buttonEl: el.shareBtn,
      score,
      maxCombo,
      correctCount,
    });
  });
  el.soundToggleBtn.addEventListener('click', () => {
    sound.setSoundEnabled(!sound.isSoundEnabled());
    renderSoundToggle();
    sound.playButtonClick();
  });
}

function renderSoundToggle() {
  const on = sound.isSoundEnabled();
  el.soundToggleBtn.textContent = on ? '🔊' : '🔇';
  el.soundToggleBtn.classList.toggle('muted', !on);
}

async function bootstrapData() {
  render.showLoading();
  try {
    const sentences = await loadSentences();
    pool = shuffle(sentences.slice());
    vocab = buildVocabPool(sentences);
    render.hideLoading();
    idx = 0;
    loadNext();
  } catch (err) {
    render.showLoadError(
      'Gagal memuat soal. Periksa koneksi atau file data/sentences.json, lalu coba lagi.',
      bootstrapData
    );
    console.error(err);
  }
}

function loadNext() {
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
  if (idx >= pool.length) { idx = 0; shuffle(pool); }
  current = pool[idx++];
  answered = false;
  answerTokens = [];

  el.card.classList.remove('correct', 'wrong', 'shake');
  el.revealBox.classList.remove('show');
  el.checkBtn.style.display = 'block';
  el.checkBtn.disabled = true;
  el.nextBtn.classList.remove('show');
  el.skipBtn.disabled = false;

  el.promptId.textContent = current.t;

  const distractors = pickDistractors(vocab, current.k, DISTRACTOR_COUNT);
  const allTiles = current.k.map((tok, i) => ({ tok, id: 'c' + i, distractor: false }))
    .concat(distractors.map((tok, i) => ({ tok, id: 'd' + i, distractor: true })));
  bankState = shuffle(allTiles).map(o => ({ ...o, used: false }));

  render.renderBank(bankState, placeToken);
  render.renderAnswer(answerTokens, removeToken);
}

function placeToken(bankIndex) {
  if (answered) return;
  const item = bankState[bankIndex];
  if (item.used) return;
  item.used = true;
  answerTokens.push(item);
  sound.playTilePlace();
  render.renderBank(bankState, placeToken);
  render.renderAnswer(answerTokens, removeToken);
  el.checkBtn.disabled = answerTokens.length === 0;
}

function removeToken(item) {
  if (answered) return;
  item.used = false;
  answerTokens = answerTokens.filter(t => t !== item);
  sound.playTileRemove();
  render.renderBank(bankState, placeToken);
  render.renderAnswer(answerTokens, removeToken);
  el.checkBtn.disabled = answerTokens.length === 0;
}

function checkAnswer() {
  if (answered || answerTokens.length === 0) return;
  answered = true;
  el.skipBtn.disabled = true;

  const userTokensArr = answerTokens.map(t => t.tok);
  const correct = isAnswerCorrect(userTokensArr, current.k);

  el.revealBox.classList.add('show');
  render.renderComparison(compareTokens(userTokensArr, current.k));

  if (correct) {
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    correctCount++;
    const gained = comboPoints(combo);
    score += gained;
    sound.playCorrect(combo);
    el.card.classList.add('correct');
    el.revealSub.className = 'reveal-sub ok-text';
    el.revealSub.textContent = current.e + '  ·  Benar!';
    render.popScore(gained);
    render.showCombo(combo);

    render.renderScore(score);
    if (score > best) {
      best = score;
      render.renderBest(best);
      saveBestScore(best);
    }

    if (combo % LIFE_REGEN_COMBO === 0 && lives < MAX_LIVES) {
      gainLife();
    }

    el.checkBtn.style.display = 'none';
    advanceTimer = setTimeout(loadNext, AUTO_ADVANCE_DELAY);
  } else {
    combo = 0;
    sound.playWrong();
    render.hideCombo();
    el.card.classList.add('wrong', 'shake');
    el.revealSub.className = 'reveal-sub no-text';
    el.checkBtn.style.display = 'none';
    el.revealSub.textContent = current.e;
    loseLife();
    if (lives > 0) {
      el.nextBtn.classList.add('show');
    }
  }
}

function loseLife() {
  lives--;
  render.renderHearts(lives, MAX_LIVES);
  render.pulseLostHeart(lives);
  if (lives <= 0) {
    setTimeout(triggerGameOver, 1100);
  }
}

function gainLife() {
  lives = Math.min(MAX_LIVES, lives + 1);
  sound.playLifeGain();
  render.renderHearts(lives, MAX_LIVES);
  render.pulseGainedHeart(lives);
  render.popLife();
}

function triggerGameOver() {
  sound.playGameOver();
  el.goScore.textContent = score;
  el.goCombo.textContent = maxCombo;
  el.goCorrect.textContent = correctCount;
  el.goBestSmall.textContent = Math.max(best, score);
  el.goNewBest.classList.toggle('show', score >= best && score > 0);
  el.gameOver.classList.add('show');
}

function resetGame() {
  score = 0;
  combo = 0;
  maxCombo = 0;
  correctCount = 0;
  lives = MAX_LIVES;
  render.renderScore(0);
  render.hideCombo();
  render.renderHearts(lives, MAX_LIVES);
  el.gameOver.classList.remove('show');
  shuffle(pool);
  idx = 0;
  loadNext();
}

init();
