// do some basic validation of legacy usage for node version older than 10

var assert = require("assert");

var makeOptionalRequire = require("../dist-cjs/cjs/index.cjs").makeOptionalRequire;

var optionalRequire = makeOptionalRequire(require);

var r1 = optionalRequire("require-at");

assert(r1, "didn't require require-at");

const bar = optionalRequire("bar", true);

var r2 = optionalRequire("blah");

assert(r2 === undefined);

var r3 = optionalRequire("foo", { default: "not found" });

assert(r3 === "not found");

var xyz = optionalRequire("xyz", "test");

assert(xyz === undefined);

var rel = optionalRequire("./data/good.cjs");

assert(rel === "hello");

var badErr;
try {
  optionalRequire("./data/bad.cjs");
} catch (err) {
  badErr = err;
}

assert(badErr);

var failErr;

try {
  optionalRequire("./data/error.cjs");
} catch (err) {
  failErr = err;
}

assert(failErr);
