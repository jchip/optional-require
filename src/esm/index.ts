import { setAppPathAtTopNodeModules, makeOptionalRequire } from "../optional-require.ts";

const appPath = setAppPathAtTopNodeModules(import.meta.url);

/**
 * A default optionalRequire function using `require` or `import` from the app's directory (e.g. same level as node_modules).
 *
 * You can still override the `require` using `options.require` with the one from your
 * calling context.
 *
 */
const optionalRequire = makeOptionalRequire(appPath);

export { optionalRequire };

export * from "../optional-require.ts";

export default optionalRequire;

