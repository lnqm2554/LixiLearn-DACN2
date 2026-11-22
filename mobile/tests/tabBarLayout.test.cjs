const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'utils', 'tabBarLayout.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const layoutModule = { exports: {} };
new Function('module', 'exports', compiled)(layoutModule, layoutModule.exports);
const { getTabBarLayout } = layoutModule.exports;

test('adds the device bottom safe-area inset to the tab bar height', () => {
  assert.deepEqual(getTabBarLayout(390, 34), {
    height: 98,
    paddingBottom: 34,
    showLabels: true,
  });
});

test('uses compact accessible icon tabs at narrow widths', () => {
  assert.deepEqual(getTabBarLayout(320, 0), {
    height: 64,
    paddingBottom: 8,
    showLabels: false,
  });
});
