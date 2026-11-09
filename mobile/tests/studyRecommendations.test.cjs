const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'studyRecommendations.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const recommendationModule = { exports: {} };
new Function('module', 'exports', compiled)(recommendationModule, recommendationModule.exports);
const { getNextCardIndex } = recommendationModule.exports;

function card(difficulty, repetition, interval, dueDate = new Date().toISOString()) {
  return { difficulty, repetition, interval, dueDate };
}

test('normal schedule selects the next card in order', () => {
  assert.equal(getNextCardIndex([card('easy', 0, 1), card('hard', 1, 6)], 0), 1);
});

test('review recommendation prioritizes the least-mastered remaining card', () => {
  const cards = [
    card('easy', 0, 1),
    card('hard', 4, 20),
    card('medium', 1, 1),
  ];
  assert.equal(getNextCardIndex(cards, 0, 'review_now'), 2);
});

test('challenge recommendation prioritizes the hardest remaining card', () => {
  const cards = [
    card('easy', 0, 1),
    card('medium', 1, 6),
    card('hard', 2, 10),
  ];
  assert.equal(getNextCardIndex(cards, 0, 'challenge_mode'), 2);
});

test('returns null when the current card is the last in the queue', () => {
  assert.equal(getNextCardIndex([card('easy', 0, 1)], 0), null);
});
