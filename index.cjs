"use strict";

/**
 * Compatibility bridge to the new typescript code.
 *
 */

const lib = require("./dist-cjs/cjs/index.cjs");

module.exports = function () {
  return lib.makeOptionalRequire.apply(lib, arguments);
};

module.exports.tryRequire = lib.tryRequire;
module.exports.tryResolve = lib.tryResolve;
module.exports.try = lib.tryRequire;
module.exports.resolve = lib.tryResolve;
module.exports.makeOptionalRequire = lib.makeOptionalRequire;
module.exports.optionalRequire = lib.optionalRequire;
module.exports.optionalRequireCwd = lib.optionalRequireCwd;
module.exports.setAppPathAtTopNodeModules = lib.setAppPathAtTopNodeModules;
module.exports.setAppPath = lib.setAppPath;
module.exports.setDefaultLog = lib.setDefaultLog;
module.exports._getRequire = lib._getRequire;

let __defaultLog;

Object.defineProperty(module.exports, "log", {
  set(func) {
    __defaultLog = func;
    lib.setDefaultLog(func);
  },

  get() {
    return __defaultLog;
  },
});
