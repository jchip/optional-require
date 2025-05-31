import { makeOptionalRequire } from "optional-require";
import { createRequire } from "node:module";

console.log(makeOptionalRequire);

console.log(import.meta.url);

const blah1 = createRequire(import.meta.url)("./blah.js");
console.log("blah1", blah1);

// const optionalRequire = makeOptionalRequire(import.meta.url);

const { __esModule, blah, default: blah2 } = makeOptionalRequire(import.meta.url)("./blah");
console.log(blah);
console.log(blah2);
console.log(__esModule);

console.log("done");
