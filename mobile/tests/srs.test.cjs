const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'srs.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const srsModule = { exports: {} };
new Function('module', 'exports', compiled)(srsModule, srsModule.exports);
const { calculateSRS } = srsModule.exports;

test('successful reviews follow SM-2 intervals and increase repetition', () => {
  const first = calculateSRS(4, 0, 1, 2.5);
  assert.equal(first.interval, 1);
  assert.equal(first.repetition, 1);

  const second = calculateSRS(4, first.repetition, first.interval, first.easeFactor);
  assert.equal(second.interval, 6);
  assert.equal(second.repetition, 2);

  const third = calculateSRS(4, second.repetition, second.interval, second.easeFactor);
  assert.equal(third.interval, Math.round(6 * second.easeFactor));
  assert.equal(third.repetition, 3);
});

test('failed reviews reset repetition and schedule a one-day retry', () => {
  const result = calculateSRS(2, 4, 20, 2.5);
  assert.equal(result.interval, 1);
  assert.equal(result.repetition, 0);
  assert.equal(result.easeFactor, 2.18);
});

test('ease factor never drops below 1.3', () => {
  const result = calculateSRS(0, 2, 10, 1.3);
  assert.equal(result.easeFactor, 1.3);
});

test('due date is scheduled by the calculated number of calendar days', () => {
  const before = new Date();
  const result = calculateSRS(4, 1, 1, 2.5);
  const dueDate = new Date(result.dueDate);
  const expected = new Date(before);
  expected.setDate(expected.getDate() + 6);

  assert.equal(dueDate.getFullYear(), expected.getFullYear());
  assert.equal(dueDate.getMonth(), expected.getMonth());
  assert.equal(dueDate.getDate(), expected.getDate());
});

test('invalid review quality is rejected', () => {
  assert.throws(() => calculateSRS(6, 0, 1, 2.5), RangeError);
  assert.throws(() => calculateSRS(2.5, 0, 1, 2.5), RangeError);
});
