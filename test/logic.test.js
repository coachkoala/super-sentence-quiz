import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripTrailingPunct,
  isAnswerCorrect,
  compareTokens,
  comboPoints,
  buildVocabPool,
  pickDistractors,
} from '../js/logic.js';

test('stripTrailingPunct removes trailing .,!? but keeps apostrophes intact', () => {
  assert.equal(stripTrailingPunct('cost?'), 'cost');
  assert.equal(stripTrailingPunct('Noted,'), 'Noted');
  assert.equal(stripTrailingPunct('stars!'), 'stars');
  assert.equal(stripTrailingPunct("It's"), "It's");
  assert.equal(stripTrailingPunct("don't"), "don't");
  assert.equal(stripTrailingPunct("I'll"), "I'll");
});

test('isAnswerCorrect matches ignoring case and trailing punctuation', () => {
  const correct = ['How', 'much', 'does', 'it', 'cost'];
  assert.equal(isAnswerCorrect(['How', 'much', 'does', 'it', 'cost'], correct), true);
  assert.equal(isAnswerCorrect(['how', 'MUCH', 'does', 'it', 'cost'], correct), true);
});

test('isAnswerCorrect rejects wrong order, missing words, and extra words', () => {
  const correct = ['How', 'much', 'does', 'it', 'cost'];
  assert.equal(isAnswerCorrect(['much', 'How', 'does', 'it', 'cost'], correct), false);
  assert.equal(isAnswerCorrect(['How', 'much', 'does', 'it'], correct), false);
  assert.equal(isAnswerCorrect(['How', 'much', 'does', 'it', 'cost', 'today'], correct), false);
});

test('isAnswerCorrect handles a single-word sentence', () => {
  assert.equal(isAnswerCorrect(['Anytime'], ['Anytime']), true);
  assert.equal(isAnswerCorrect(['Anytime.'], ['Anytime']), true);
  assert.equal(isAnswerCorrect([], ['Anytime']), false);
});

test('isAnswerCorrect handles apostrophe/contraction tokens', () => {
  const correct = ["It's", 'delicious'];
  assert.equal(isAnswerCorrect(["It's", 'delicious'], correct), true);
  assert.equal(isAnswerCorrect(["it's", 'Delicious'], correct), true);
  assert.equal(isAnswerCorrect(['Its', 'delicious'], correct), false);
});

test('compareTokens flags mismatches including missing trailing words', () => {
  const correct = ['How', 'much', 'does', 'it', 'cost'];
  const result = compareTokens(['How', 'much'], correct);
  assert.equal(result.length, 5);
  assert.equal(result[0].isMatch, true);
  assert.equal(result[1].isMatch, true);
  assert.equal(result[2].isMatch, false);
  assert.equal(result[2].word, 'does');
});

test('comboPoints increases with combo level and never goes below base', () => {
  const p1 = comboPoints(1);
  const p2 = comboPoints(2);
  const p5 = comboPoints(5);
  assert.ok(p1 >= 10);
  assert.ok(p2 > p1);
  assert.ok(p5 > p2);
});

test('buildVocabPool dedupes case-insensitively and strips trailing punctuation', () => {
  const sentences = [
    { k: ['The', 'cat.'] },
    { k: ['the', 'dog!'] },
    { k: ["It's", 'fine'] },
  ];
  const vocab = buildVocabPool(sentences);
  const lower = vocab.map(w => w.toLowerCase());
  assert.equal(lower.filter(w => w === 'the').length, 1);
  assert.ok(vocab.includes("It's"));
  assert.ok(!vocab.includes('cat.'));
});

test('pickDistractors never returns a word from the correct answer', () => {
  const vocab = ['How', 'much', 'does', 'it', 'cost', 'Please', 'help'];
  const correct = ['How', 'much', 'does', 'it', 'cost'];
  for (let i = 0; i < 20; i++) {
    const [distractor] = pickDistractors(vocab, correct, 1);
    if (distractor) {
      assert.ok(!correct.map(w => w.toLowerCase()).includes(distractor.toLowerCase()));
    }
  }
});

test('pickDistractors degrades gracefully when the vocab pool is exhausted', () => {
  const vocab = ['Anytime'];
  const correct = ['Anytime'];
  const result = pickDistractors(vocab, correct, 1);
  assert.deepEqual(result, []);
});
