const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'gamification.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const gamificationModule = { exports: {} };
new Function('module', 'exports', compiled)(gamificationModule, gamificationModule.exports);
const { updateDailyStreak } = gamificationModule.exports;

test('completing another lesson on the same day does not inflate streak', () => {
  const now = new Date(2026, 10, 9, 15);
  const lastActive = new Date(2026, 10, 9, 8).toISOString();

  assert.equal(updateDailyStreak(4, lastActive, now).streak, 4);
});

test('daily streak increments after activity on the previous calendar day', () => {
  const now = new Date(2026, 10, 9, 8);
  const lastActive = new Date(2026, 10, 8, 23).toISOString();

  assert.equal(updateDailyStreak(4, lastActive, now).streak, 5);
});

test('streak restarts after one or more missed calendar days', () => {
  const now = new Date(2026, 10, 9, 8);
  const lastActive = new Date(2026, 10, 7, 23).toISOString();

  assert.equal(updateDailyStreak(4, lastActive, now).streak, 1);
});
