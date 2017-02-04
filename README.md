# Optional Require

Allows you to require a module only if it exists.

# Usage

```js
const optionalRequire = require("optional-require")(require);

const foo = optionalRequire("foo") || {};
const bar = optionalRequire("bar", true); // true enables console.log a message
const xyz = optionalRequire("xyz", "test"); // "test" enables console.log a message with "test" added.
const fbPath = optionalRequire.resolve("foo", "foo doesn't exist");
```

# Install

```bash
$ npm i optional-require --save
```

# LICENSE

Apache-2.0 © [Joel Chen](https://github.com/jchip)

