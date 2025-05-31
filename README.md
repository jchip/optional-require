[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url] [![devDependency Status][daviddm-dev-image]][daviddm-dev-url]

# Optional Require

node.js require that let you handle module not found error without try/catch. Allows you to gracefully require a module only if it exists and contains no error.

## Why not try/catch?

So why not just do:

```ts
let some;
try {
  some = require("some-optional-module");
} catch {
  // do nothing
}
```

1. **Variable scoping**: You need to keep the variable outside: `let some` before try/catch
2. **Error differentiation**: You need additional logic to distinguish between "module not found" vs "module has syntax/runtime errors". If `"some-optional-module"` contains error itself, above code will silently ignore it, leaving you, and more importantly, your users, puzzling on why it's not working -- the original reason that prompted the creation of this package.
3. **Code readability**: Nested try/catch blocks make code harder to read and maintain, especially when dealing with multiple optional modules

## Usage

**ES Modules:**
```js
import { optionalRequire } from "optional-require";

const some = optionalRequire("some-optional-module");
const bar = optionalRequire("bar", true); // log message when not found
const xyz = optionalRequire("xyz", "test"); // log with custom message
const fbPath = optionalRequire.resolve("foo", "foo doesn't exist");
```

**CommonJS:**
```js
const { optionalRequire } = require("optional-require");

const foo = optionalRequire("foo") || {};
const rel = optionalRequire("../foo/bar", { require }); // relative paths need require
```

### Custom Context

To require modules relative to your file, bind the function to your context:

**ESM:**
```js
import { makeOptionalRequire } from "optional-require";
const optionalRequire = makeOptionalRequire(import.meta.url);
const myModule = optionalRequire("./my-module");
```

**CommonJS:**
```js
const { makeOptionalRequire } = require("optional-require");
const optionalRequire = makeOptionalRequire(__dirname);
// or
const optionalRequire = makeOptionalRequire(require);
const myModule = optionalRequire("./my-module");
```

## Requirements

- **Node.js 20+**: Full support for both ESM and CommonJS through conditional exports

## Legacy Usage

In older versions, this module exports `makeOptionalRequire` directly and this is the legacy usage in **CommonJS only**, which is still supported:

```js
const optionalRequire = require("optional-require")(require);

const foo = optionalRequire("foo") || {};
const bar = optionalRequire("bar", true); // true enables console.log a message when not found
const xyz = optionalRequire("xyz", "test"); // "test" enables console.log a message with "test" added.
const fbPath = optionalRequire.resolve("foo", "foo doesn't exist");
const rel = optionalRequire("../foo/bar"); // relative module path works
```

**Note**: This legacy pattern only works in CommonJS mode since it relies on the `require` function.

## API

<https://jchip.github.io/optional-require/modules.html#optionalrequire>

# LICENSE

Apache-2.0 © [Joel Chen](https://github.com/jchip)

[travis-image]: https://travis-ci.org/jchip/optional-require.svg?branch=master
[travis-url]: https://travis-ci.org/jchip/optional-require
[npm-image]: https://badge.fury.io/js/optional-require.svg
[npm-url]: https://npmjs.org/package/optional-require
[daviddm-image]: https://david-dm.org/jchip/optional-require/status.svg
[daviddm-url]: https://david-dm.org/jchip/optional-require
[daviddm-dev-image]: https://david-dm.org/jchip/optional-require/dev-status.svg
[daviddm-dev-url]: https://david-dm.org/jchip/optional-require?type=dev
