const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'leaderboard.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const leaderboardModule = { exports: {} };
new Function('module', 'exports', compiled)(leaderboardModule, leaderboardModule.exports);
const { getCurrentWeekXP } = leaderboardModule.exports;

test('weekly XP includes events since Monday and excludes older or future events', () => {
  const referenceDate = new Date(2026, 10, 9, 12);
  const events = [
    { amount: 10, createdAt: new Date(2026, 10, 9, 9).toISOString() },
    { amount: 20, createdAt: new Date(2026, 10, 8, 23).toISOString() },
    { amount: 30, createdAt: new Date(2026, 10, 10, 9).toISOString() },
    { amount: 40, createdAt: 'invalid-date' },
  ];

  assert.equal(getCurrentWeekXP(events, referenceDate), 10);
});

test('weekly XP returns zero when no events occurred this week', () => {
  const referenceDate = new Date(2026, 10, 9, 12);
  const oldEvent = { amount: 25, createdAt: new Date(2026, 10, 1, 12).toISOString() };

  assert.equal(getCurrentWeekXP([oldEvent], referenceDate), 0);
});
