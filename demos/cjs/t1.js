console.log("__dirname", __dirname);

const { makeOptionalRequire, optionalRequire } = require("optional-require");

console.log(makeOptionalRequire);

// const optionalRequire = makeOptionalRequire(import.meta.url);

const blah1 = require("./blah");
console.log("blah1", blah1);

// const blah = makeOptionalRequire(__dirname)("./blah");
const blah = optionalRequire("./blah.js", {
  fail: () => {
    console.log("fail");
  },
});
console.log("blah", blah);
// console.log(blah2);
// console.log(__esModule);

const pkgEsm = optionalRequire("pkg-esm");
console.log("pkgEsm", pkgEsm);

console.log("done");
