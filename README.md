# Optional Require

Allows you to require a module only if it exists.

# Usage

```js
const optionalRequire = require("optional-require")(require);

const foo = optionalRequire("foo") || {};
const bar = optionalRequire("bar", true); // true enables console.log a message when not found
const xyz = optionalRequire("xyz", "test"); // "test" enables console.log a message with "test" added.
const fbPath = optionalRequire.resolve("foo", "foo doesn't exist");
const rel = optionalRequire("../foo/bar"); // relative module path works
```

# Install

```bash
$ npm i optional-require --save
```

# API

#### [optionalRequire(require)]()

The single function this module exports.  Call it with `require` to get a custom function for your file to do optional require.  See [Usage](#usage) above.

#### [customOptionalRequire(path, [message])]()

The function [optionalRequire]() returns for your file to do optional require in your file.

##### Params

  - `path` - name/path to the module your want to optionally require
  - `message` - optional flag/message to enable `console.log` a message when module is not found

##### Returns
  - module required or `undefined` if not found

##### Throws

  - rethrows any error that's not `MODULE_NOT_FOUND` for the module `path`

#### [customOptionalRequire.resolve(path, [message])]()

Same as [customOptionalRequire]() but acts like `require.resolve`

# LICENSE

Apache-2.0 © [Joel Chen](https://github.com/jchip)

