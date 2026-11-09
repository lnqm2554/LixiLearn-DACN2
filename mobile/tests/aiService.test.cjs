const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'services', 'aiService.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function loadAiService({ platform = 'web', env = {}, post = async () => ({ data: {} }) } = {}) {
  const serviceModule = { exports: {} };
  const mockedRequire = (moduleName) => {
    if (moduleName === 'react-native') return { Platform: { OS: platform } };
    if (moduleName === 'axios') return { post };
    throw new Error(`Unexpected dependency: ${moduleName}`);
  };
  new Function('module', 'exports', 'require', 'process', compiled)(
    serviceModule,
    serviceModule.exports,
    mockedRequire,
    { env }
  );
  return serviceModule.exports;
}

test('AI URL defaults to localhost for web and emulator host for Android', () => {
  assert.equal(loadAiService().getAiServiceBaseUrl(), 'http://localhost:8000');
  assert.equal(loadAiService({ platform: 'android' }).getAiServiceBaseUrl(), 'http://10.0.2.2:8000');
  assert.equal(loadAiService({ platform: 'ios' }).getAiServiceBaseUrl(), null);
});

test('configured AI URL is normalized and validated', () => {
  const service = loadAiService({
    env: { EXPO_PUBLIC_AI_SERVICE_URL: 'https://ai.example.test///' },
  });
  assert.equal(service.getAiServiceBaseUrl(), 'https://ai.example.test');

  const invalid = loadAiService({
    env: { EXPO_PUBLIC_AI_SERVICE_URL: 'not a URL' },
  });
  assert.throws(() => invalid.getAiServiceBaseUrl(), /valid absolute URL/);
});

test('trained model results are identified separately from fallbacks', async () => {
  const service = loadAiService({
    post: async () => ({
      data: {
        card_id: 'word-1',
        success_probability: 0.8,
        predicted_outcome: 1,
        recommended_action: 'normal_schedule',
        model_version: 'RandomForest-Tuned-v2.0',
        key_factor: 'accuracy',
      },
    }),
  });
  const result = await service.getPersonalizedRecommendation({
    user_id: 'user-1',
    card_id: 'word-1',
    difficulty_level: 1,
    recent_accuracy: 0.8,
    avg_response_time_ms: 2000,
    consecutive_correct: 2,
    streak: 3,
    review_count: 1,
  });

  assert.equal(result.source, 'model');
});

test('offline fallback remains explicit when the service is unreachable', async () => {
  const service = loadAiService({
    post: async () => {
      throw new Error('offline');
    },
  });
  const originalWarn = console.warn;
  console.warn = () => {};
  let result;
  try {
    result = await service.getPersonalizedRecommendation({
      user_id: 'user-1',
      card_id: 'word-1',
      difficulty_level: 1,
      recent_accuracy: 0.4,
      avg_response_time_ms: 2000,
      consecutive_correct: 0,
      streak: 1,
      review_count: 1,
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(result.source, 'offline_fallback');
  assert.equal(result.recommended_action, 'review_now');
});
