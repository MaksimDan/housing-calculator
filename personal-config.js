// Personal starting values for the dev server.
//
// `npm run dev` starts the calculator from personal.config.ts when that file
// exists (it is git-ignored; see personal.config.example.ts). Builds and tests
// always get null, so nobody's numbers can reach the deployed bundle, even
// when the build runs on a machine that has the file.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';

export const PERSONAL_CONFIG_ID = 'virtual:personal-config';
const RESOLVED_ID = '\0' + PERSONAL_CONFIG_ID;

export const personalConfig = (
  file = normalizePath(fileURLToPath(new URL('./personal.config.ts', import.meta.url)))
) => {
  let enabled = false;
  const reload = (server) => {
    const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
    if (mod) server.moduleGraph.invalidateModule(mod);
    server.ws.send({ type: 'full-reload' });
  };
  return {
    name: 'personal-config',
    configResolved(config) {
      enabled = config.command === 'serve' && config.mode !== 'test';
    },
    resolveId(id) {
      if (id === PERSONAL_CONFIG_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      return enabled && existsSync(file)
        ? `export { default } from ${JSON.stringify(file)};`
        : 'export default null;';
    },
    // Creating, editing or deleting the file reloads the page with it
    configureServer(server) {
      server.watcher.add(file);
      const onAddOrUnlink = (changed) => {
        if (normalizePath(changed) === file) reload(server);
      };
      server.watcher.on('add', onAddOrUnlink);
      server.watcher.on('unlink', onAddOrUnlink);
    },
    handleHotUpdate({ file: changed, server }) {
      if (changed !== file) return;
      reload(server);
      return [];
    },
  };
};
