console.log("__dirname", __dirname);

const optionalRequire = require("optional-require")(require);


const blah1 = require("./blah");
console.log("blah1", blah1);

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
