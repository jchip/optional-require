import assert from "assert";
import requireAt from "require-at";
import { URL } from "node:url";

/* eslint-disable max-params, complexity */

let appPath = process.cwd();

export function setAppPathAtTopNodeModules(appPath: string): string {
  const nmIdx = appPath.indexOf("/node_modules/");
  if (nmIdx !== -1) {
    appPath = appPath.slice(0, nmIdx);
  }
  return appPath;
}

export function setAppPath(path: string) {
  appPath = path;
}

// Copied from https://github.com/yarnpkg/berry/blob/d5454007c9c76becfa97b36a92de299a3694afd5/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L27
// Splits a require request into its components, or return null if the request is a file path
const pnpDependencyNameRegExp = /^(?![a-zA-Z]:[\\/]|\\\\|\.{0,2}(?:\/|$))((?:node:)?(?:@[^/]+\/)?[^/]+)\/*(.*|)$/;

/**
 * Change a module name request into a Yarn Berry PnP dependency name,
 * since the dependency name is what will be included in the error message.
 * For example, `optionalRequire('my-package/package.json')` will print a message like
 * `Your application tried to access my-package,` without the `/package.json` at the end of it.
 * This function grabs the dependency name only, or returns `null` if it can't find it.
 * @param {string} name Requested name
 * @returns {string} Dependency name
 */
function getPnpDependencyName(name: string): string | null {
  const dependencyNameMatch = name.match(pnpDependencyNameRegExp);
  if (!dependencyNameMatch) return null;
  return dependencyNameMatch[1];
}

/**
 * Check if an error from require is really due to the module not found,
 * and not because the module itself trying to require another module
 * that's not found.
 *
 * @param err - the error
 * @param name - name of the module being required
 * @returns true or false
 */
function checkSelfModuleNotFoundErrors(err: Error, name: string) {
  // Check the first line of the error message
  const msg = err.message.split("\n")[0];
  /* c8 ignore start */
  if (!msg) {
    return false;
  }
  /* c8 ignore stop */

  // exception that's not due to the module itself not found
  if (
    (err as any).code === "MODULE_NOT_FOUND" &&
    // if the module we are requiring failed because it try to require a
    // module that's not found, then we have to report this as failed.
    // so the error message must contain the module name we are requiring.
    msg.includes(`not find module '${name}'`)
  ) {
    return true;
  }

  const pnpDependencyName = getPnpDependencyName(name);
  if (pnpDependencyName) {
    return (
      // Check for "Your application tried to access foo (a peer dependency) ..." (Yarn Berry PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L680
      msg.includes(` ${pnpDependencyName} `) ||
      // Check for "Your application tried to access foo. While ..." (Yarn Berry PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L704
      msg.includes(` ${pnpDependencyName}. `) ||
      // Check for "Your application tried to access foo, but ..." (Yarn Berry PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L718
      msg.includes(` ${pnpDependencyName}, `)
    );
  }

  return false;
}

/**
 * function to log in case require module was not found
 *
 * @params message - message to log
 * @params path - path of the module that user tried to require
 */
export type LogFunction = (message: string, path: string) => void;

/**
 * Options for calling optionalRequire
 */
export type OptionalRequireOpts = {
  /**
   * `notFound` is a function. If error from require was `MODULE_NOT_FOUND`, then:
   *
   * - call `notFound` if it's provided
   * - else return the `default` value.
   *
   * @remark in case the error was not `MODULE_NOT_FOUND`, will instead call the `fail` function
   * if it's provided.
   *
   * @param err - the error from require
   */
  notFound?: (err: Error) => unknown;
  /**
   * `fail` is a function. If error from require was something other than `MODULE_NOT_FOUND`,
   * for example, the module contains syntax error, then:
   *
   * - call `fail` if it's provided
   * - else rethrow the error
   *
   * @remark This is a separate callback from `notFound` so user can handle
   * real `MODULE_NOT_FOUND` exception separately, or let the `default` be returned.
   *
   * @param err - the error from require
   */
  fail?: (err: Error) => unknown;

  /**
   * The value to return if error was `MODULE_NOT_FOUND` but `notFound` is not provided.
   */
  default?: unknown;

  /**
   * Tell optional require to log a message if the module is not found.
   * - note: it doesn't log if the error is not due to the module not found
   *
   * This field can have these values:
   * 1. `true` - log with default message
   * 2. string - a string to prepend to the message being logged
   *
   * @remarks to further customize logging, set the `log` function.
   */
  message?: true | string;

  /**
   * function to log the module not found message, default log function uses `console.log`
   */
  log?: LogFunction;

  /**
   * `require` is the node.js require function from caller's context.
   *
   * If not provided, then use the one received when creating the optional require function
   */
  require?: NodeJS.Require;

  /**
   * If `true`, then do an optional `require.resolve` and return the full path
   */
  resolve?: boolean;
};

/**
 * Default log function
 *
 * @param message - message to log
 * @param path - path of the module to require
 */
function defaultLog(message: string, path: string) {
  console.log(`Just FYI: ${message}; Path "${path}"`);
}

let __defaultLog = defaultLog;

export function setDefaultLog(log: LogFunction): void {
  __defaultLog = log;
}

/**
 * Get the require function from the caller's context
 * @param callerRequire - the require function from the caller's context
 * @returns the require function
 */
export function _getRequire(callerRequire: NodeJS.Require | string, fallbackPath?: string): NodeJS.Require {
  if (!callerRequire) {
    return requireAt(fallbackPath || process.cwd());
  } else if (typeof callerRequire === "string") {
    try {
      return requireAt(new URL(callerRequire).pathname);
    } catch {
      return requireAt(callerRequire);
    }
  } else {
    return callerRequire;
  }
}

function _getOptions(
  optsOrMsg: OptionalRequireOpts | string | true | undefined,
  requireFunction: NodeJS.Require,
  log?: LogFunction
): OptionalRequireOpts {
  if (typeof optsOrMsg === "object") {
    const opts = { require: requireFunction, log, ...optsOrMsg };
    assert(
      !(opts.hasOwnProperty("notFound") && opts.hasOwnProperty("default")),
      "optionalRequire: options set with both `notFound` and `default`"
    );
    return opts;
  } else {
    return { require: requireFunction, log, message: optsOrMsg };
  }
}

/**
 * Internal optional require implementation
 *
 * @param path - path to module to require
 * @param optsOrMsg - options or message to log in case module not found
 * @returns require or resolve result
 */
function _optionalRequire(path: string, opts: OptionalRequireOpts) {
  try {
    return opts.resolve ? opts.require!.resolve(path) : opts.require!(path);
  } catch (e) {
    if (!checkSelfModuleNotFoundErrors(e, path)) {
      if (typeof opts.fail === "function") {
        return opts.fail(e);
      }
      throw e;
    }

    if (opts.message) {
      const message = opts.message === true ? "" : `${opts.message} - `;
      const r = opts.resolve ? "resolved" : "found";
      opts.log!(`${message}optional module not ${r}`, path);
    }

    if (typeof opts.notFound === "function") {
      return opts.notFound(e);
    }

    return opts.default;
  }
}

/**
 * try to require a module with optional handling in case it's not found or fail to require
 *
 * @param callerRequire - `require` from caller context
 * @param path - path to module to require
 * @param optsOrMsg - options or message to log in case of exceptions
 * @returns require result
 */
export function tryRequire(
  callerRequire: NodeJS.Require | string,
  path: string,
  optsOrMsg?: OptionalRequireOpts | string | true
): unknown {
  const opts = _getOptions(optsOrMsg, _getRequire(callerRequire), __defaultLog);
  opts.resolve = false;
  return _optionalRequire(path, opts);
}

/**
 * try to resolve a module with optional handling in case it's not found or fail to require
 *
 * @param callerRequire - `require` from caller context
 * @param path - path to module to require
 * @param optsOrMsg - options or message to log in case of exceptions
 * @returns resolve result
 */
export function tryResolve(
  callerRequire: NodeJS.Require | string,
  path: string,
  optsOrMsg?: OptionalRequireOpts | string | true
): string {
  const opts = _getOptions(optsOrMsg, _getRequire(callerRequire), __defaultLog);
  opts.resolve = true;
  return _optionalRequire(path, opts);
}

/**
 * function to require a module with optional handling in case it's not found or fail to require
 */
export type OptionalRequireFunction<T = any> = {
  /**
   * @param path - path to module to require
   * @param optsOrMsg - options or message to log when module not found
   */
  (path: string, optsOrMsg?: OptionalRequireOpts | string | true): T;
  /**
   * resolve the module's full path
   *
   * @param path - path to module to resolve
   * @param optsOrMsg - options or message to log when module not found
   * @returns resolve result
   */
  resolve: (path: string, opsOrMsg?: OptionalRequireOpts | string | true) => string;
  /**
   * function to log message, default to use `console.log`, you can replace this with
   * another function.
   */
  log: LogFunction;
};

/**
 * Make an optional require function, using the `require` from caller's context.
 *
 * @param callerRequire - `require` from caller's context
 * @param log - function to log if module is not found
 * @returns required module
 */
export function makeOptionalRequire<T = any>(
  callerRequire: NodeJS.Require | string,
  log?: (message: string, path: string) => void
): OptionalRequireFunction<T> {
  let _require: NodeJS.Require = _getRequire(callerRequire);

  const x = (path: string, optsOrMsg?: OptionalRequireOpts | string | true): T => {
    const opts = _getOptions(optsOrMsg, _require, x.log);
    return _optionalRequire(path, opts);
  };

  x.resolve = (path: string, optsOrMsg?: OptionalRequireOpts | string | true): string => {
    const opts = _getOptions(optsOrMsg, _require, x.log);
    opts.resolve = true;
    return _optionalRequire(path, opts);
  };

  x.log = log || __defaultLog;

  return x;
}

/**
 * An optionalRequire function using `require` or `import` from CWD context
 *
 * @remarks because `require` is from CWD context, if you do `optionalRequireCwd("./my-module")`
 * then it will look for `my-module` in CWD.
 *
 * @remarks You can still override the `require` using `options.require` with the one from your
 * calling context.
 */
export const optionalRequireCwd = makeOptionalRequire(process.cwd());
