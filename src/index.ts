import assert from "assert";
import requireAt from "require-at";

/* eslint-disable max-params, complexity, no-eval */

// `require` from this module's context
// Using `eval` to avoid tripping bundlers like webpack
const xrequire = eval("require");

/**
 * Check if an error from require is really due to the module not found,
 * and not because the module itself trying to require another module
 * that's not found.
 *
 * @param err - the error
 * @param name - name of the module being required
 * @returns true or false
 */
function findModuleNotFound(err: Error, name: string) {
  // Check the first line of the error message
  const msg = err.message.split("\n")[0];
  return (
    msg &&
    // Check for "Cannot find module 'foo'"
    (msg.includes(`'${name}'`) ||
      // Check for "Your application tried to access foo (a peer dependency) ..." (Yarn v2 PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L680
      msg.includes(` ${name} `) ||
      // Check for "Your application tried to access foo. While ..." (Yarn v2 PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L704
      msg.includes(` ${name}. `) ||
      // Check for "Your application tried to access foo, but ..." (Yarn v2 PnP)
      // https://github.com/yarnpkg/berry/blob/e81dc0d29bb2f41818d9c5c1c74bab1406fb979b/packages/yarnpkg-pnp/sources/loader/makeApi.ts#L718
      msg.includes(` ${name}, `))
  );
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
  require?: NodeRequire;

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

function _getOptions(
  optsOrMsg: OptionalRequireOpts | string | true,
  requireFunction: NodeRequire = xrequire,
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
    return opts.resolve ? opts.require.resolve(path) : opts.require(path);
  } catch (e) {
    // exception that's not due to the module itself not found
    if (e.code !== "MODULE_NOT_FOUND" || !findModuleNotFound(e, path)) {
      // if the module we are requiring fail because it try to require a
      // module that's not found, then we have to report this as failed.
      if (typeof opts.fail === "function") {
        return opts.fail(e);
      }
      throw e;
    }

    if (opts.message) {
      const message = opts.message === true ? "" : `${opts.message} - `;
      const r = opts.resolve ? "resolved" : "found";
      opts.log(`${message}optional module not ${r}`, path);
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
  callerRequire: NodeRequire,
  path: string,
  optsOrMsg?: OptionalRequireOpts | string | true
): unknown {
  const opts = _getOptions(optsOrMsg, callerRequire, __defaultLog);
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
  callerRequire: NodeRequire,
  path: string,
  optsOrMsg?: OptionalRequireOpts | string | true
): string {
  const opts = _getOptions(optsOrMsg, callerRequire, __defaultLog);
  opts.resolve = true;
  return _optionalRequire(path, opts);
}

/**
 * function to require a module with optional handling in case it's not found or fail to require
 */
export type OptionalRequireFunction = {
  /**
   * @param path - path to module to require
   * @param optsOrMsg - options or message to log when module not found
   */
  (path: string, optsOrMsg?: OptionalRequireOpts | string | true): unknown;
  /**
   * resolve the module's full path
   *
   * @param path - path to module to resolve
   * @param optsOrMsg - options or message to log when module not found
   * @returns resolve result
   */
  resolve: (path: string, opsOrMsg?: OptionalRequireOpts | string | true) => unknown;
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
export function makeOptionalRequire(
  callerRequire: NodeRequire,
  log?: (message: string, path: string) => void
): OptionalRequireFunction {
  const x = (path: string, optsOrMsg?: OptionalRequireOpts | string | true): unknown => {
    const opts = _getOptions(optsOrMsg, callerRequire, x.log);
    return _optionalRequire(path, opts);
  };

  x.resolve = (path: string, optsOrMsg?: OptionalRequireOpts | string | true): unknown => {
    const opts = _getOptions(optsOrMsg, callerRequire, x.log);
    opts.resolve = true;
    return _optionalRequire(path, opts);
  };

  x.log = log || __defaultLog;

  return x;
}

/**
 * A default optionalRequire function using `require` from optional-require's context.
 *
 * @remarks because `require` is from optional-require's context, you won't be able to
 * do `optionalRequire("./my-module")`.
 *
 * You can still override the `require` using `options.require` with the one from your
 * calling context.
 *
 */
export const optionalRequire = makeOptionalRequire(xrequire);

/**
 * An optionalRequire function using `require` from CWD context
 *
 * @remarks because `require` is from CWD context, if you do `optionalRequireCwd("./my-module")`
 * then it will look for `my-module` in CWD.
 *
 * @remarks You can still override the `require` using `options.require` with the one from your
 * calling context.
 */
export const optionalRequireCwd = makeOptionalRequire(requireAt(process.cwd()));
