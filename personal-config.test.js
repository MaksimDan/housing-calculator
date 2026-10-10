import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizePath } from 'vite';
import { personalConfig, PERSONAL_CONFIG_ID } from './personal-config.js';

const dir = mkdtempSync(join(tmpdir(), 'personal-config-'));
const file = normalizePath(join(dir, 'personal.config.ts'));
writeFileSync(file, 'export default { homePrice: 1 };');

// What the virtual module contains for a given Vite command and mode
const moduleFor = (command, mode, path = file) => {
  const plugin = personalConfig(path);
  plugin.configResolved({ command, mode });
  return plugin.load(plugin.resolveId(PERSONAL_CONFIG_ID));
};

describe('personal-config plugin', () => {
  it('gives the dev server the personal config', () => {
    expect(moduleFor('serve', 'development')).toBe(`export { default } from ${JSON.stringify(file)};`);
  });

  it('never puts it in a build, even on a machine that has the file', () => {
    expect(moduleFor('build', 'production')).toBe('export default null;');
  });

  it('keeps it out of the tests', () => {
    expect(moduleFor('serve', 'test')).toBe('export default null;');
  });

  it('falls back to the defaults when there is no file', () => {
    expect(moduleFor('serve', 'development', normalizePath(join(dir, 'missing.ts')))).toBe('export default null;');
  });

  it('leaves every other module alone', () => {
    const plugin = personalConfig(file);
    expect(plugin.resolveId('./src/main.jsx')).toBeUndefined();
    expect(plugin.load('/src/main.jsx')).toBeUndefined();
  });
});
