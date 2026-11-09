const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'speechEvaluation.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const evaluationModule = { exports: {} };
new Function('module', 'exports', compiled)(evaluationModule, evaluationModule.exports);
const { evaluateTranscriptMatch } = evaluationModule.exports;

test('exact recognized text receives a full text-match score', () => {
  const result = evaluateTranscriptMatch('Microservice', 'microservice');

  assert.equal(result.similarityScore, 100);
  assert.equal(result.accuracyGrade, 'excellent');
});

test('empty or inaccurate transcript does not qualify as a pronunciation reward', () => {
  assert.equal(evaluateTranscriptMatch('', 'microservice').similarityScore, 0);
  assert.ok(evaluateTranscriptMatch('service', 'microservice').similarityScore < 70);
});
