// personal.config.ts's default export on the dev server, null everywhere else
// (see personal-config.js)
declare module 'virtual:personal-config' {
  const config: Record<string, unknown> | null;
  export default config;
}
