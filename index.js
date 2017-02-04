"use strict";

function optionalModule(callerRequire, resolve, path, message) {
  try {
    return resolve ? callerRequire.resolve(path) : callerRequire(path);
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND" || e.message.indexOf(path) < 0) {
      throw e;
    }
    if (message) {
      message = typeof message === "string" ? `${message} - ` : "";
      console.log(`Just FYI: ${message}optional module not found; Path "${path}"`);
    }
  }
}

function optionalRequire(callerRequire) {
  const x = (path, message) => optionalModule(callerRequire, false, path, message);
  x.resolve = (path, message) => optionalModule(callerRequire, true, path, message);
  return x;
}

module.exports = optionalRequire;
optionalRequire.optionalModule = optionalModule;

