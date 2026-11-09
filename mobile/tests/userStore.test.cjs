const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const zustand = require('zustand');
const zustandMiddleware = require('zustand/middleware');

const sourcePath = path.join(__dirname, '..', 'src', 'store', 'useUserStore.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function createStore(memory) {
  const mockCards = {
    INITIAL_FLASHCARDS: [
      {
        id: 'card-1',
        interval: 1,
        repetition: 2,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
      },
    ],
  };
  const mockedRequire = (moduleName) => {
    if (moduleName === 'zustand') return zustand;
    if (moduleName === 'zustand/middleware') return zustandMiddleware;
    if (moduleName === '@react-native-async-storage/async-storage') {
      return {
        getItem: async (key) => memory.get(key) ?? null,
        setItem: async (key, value) => memory.set(key, value),
        removeItem: async (key) => memory.delete(key),
      };
    }
    if (moduleName === '../constants/mockCards') return mockCards;
    if (moduleName === '../utils/gamification') {
      return { updateDailyStreak: (streak) => ({ streak, lastActiveDate: new Date().toISOString() }) };
    }
    throw new Error(`Unexpected dependency: ${moduleName}`);
  };
  const storeModule = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(
    storeModule,
    storeModule.exports,
    mockedRequire
  );
  return storeModule.exports.useUserStore;
}

async function waitForHydration(store) {
  for (let attempt = 0; attempt < 20 && !store.persist.hasHydrated(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(store.persist.hasHydrated(), true);
}

test('review updates and learner progress survive store recreation', async () => {
  const memory = new Map();
  const firstStore = createStore(memory);
  await waitForHydration(firstStore);
  const review = {
    interval: 1,
    repetition: 0,
    easeFactor: 2.18,
    dueDate: new Date().toISOString(),
  };

  firstStore.getState().updateCardReview('card-1', review);
  firstStore.getState().addXP(15);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const persisted = JSON.parse(memory.get('lixilearn-user-state-v1'));
  persisted.version = 1;
  persisted.state.user.name = 'Sinh viên VKU';
  memory.set('lixilearn-user-state-v1', JSON.stringify(persisted));

  const secondStore = createStore(memory);
  await waitForHydration(secondStore);
  const restored = secondStore.getState();

  assert.equal(restored.user.name, 'Quang Minh');
  assert.equal(restored.user.xp, 295);
  assert.equal(restored.cards[0].repetition, 0);
  assert.equal(restored.cards[0].easeFactor, 2.18);
  assert.equal(restored.xpHistory.length, 1);
});
