"use strict";
const requireAt = require("require-at");
const { createRequire } = require("node:module");
const blah2 = requireAt(__dirname + "/tmp1")("./tmp1.js");
console.log("blah2", blah2);
