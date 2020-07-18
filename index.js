"use strict";

const assert = require("assert");

function findModuleNotFound(err, name) {
  // First line is "Cannot find module 'foo'"
  const msg = err.message.split("\n")[0];
  return msg && msg.includes(`'${name}'`);
}

function _optionalRequire(callerRequire, resolve, path, message) {
  let opts;

  if (typeof message === "object") {
    opts = message;
    assert(
      !(opts.hasOwnProperty("notFound") && opts.hasOwnProperty("default")),
      "optionalRequire: options set with both `notFound` and `default`"
    );
  } else {
    opts = { message };
  }

  try {
    return resolve ? callerRequire.resolve(path) : callerRequire(path);
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND" || !findModuleNotFound(e, path)) {
      // if the module we are requiring fail because it try to require a
      // module that's not found, then we have to report this as failed.
      if (typeof opts.fail === "function") {
        return opts.fail(e);
      }
      throw e;
    }

    if (opts.message) {
      const message = typeof opts.message === "string" ? `${opts.message} - ` : "";
      const r = resolve ? "resolved" : "found";
      optionalRequire.log(`${message}optional module not ${r}`, path);
    }

    if (typeof opts.notFound === "function") {
      return opts.notFound(e);
    }

    return opts.default;
  }
}

const tryRequire = (callerRequire, path, message) => _optionalRequire(callerRequire, false, path, message);
const tryResolve = (callerRequire, path, message) => _optionalRequire(callerRequire, true, path, message);

function optionalRequire(callerRequire) {
  const x = (path, message) => tryRequire(callerRequire, path, message);
  x.resolve = (path, message) => tryResolve(callerRequire, path, message);
  return x;
}

optionalRequire.try = tryRequire;
optionalRequire.tryResolve = tryResolve;
optionalRequire.resolve = tryResolve;
optionalRequire.log = (message, path) => console.log(`Just FYI: ${message}; Path "${path}"`);
module.exports = optionalRequire;
