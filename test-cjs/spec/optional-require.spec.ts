import { describe, it, expect, afterAll } from "vitest";
import { createRequire } from "node:module";
import { optionalRequire, makeOptionalRequire, tryRequire, tryResolve } from "../../src/cjs/index.ts";

// Create a require function for this ESM module
const require = createRequire(import.meta.url);

describe("optional-require (CJS build)", function () {
  const saveCwd = process.cwd();

  afterAll(() => {
    process.chdir(saveCwd);
  });

  describe("tryRequire", function () {
    it("should return undefined when module is not found", () => {
      expect(tryRequire(require, "not-found")).toBeUndefined();
    });

    it("should return a good module", () => {
      expect(tryRequire(require, "chai")).toBeTruthy();
    });

    it("should return a good relative module", () => {
      expect(tryRequire(require, "../data/good.cjs")).toBe("hello");
    });
  });

  describe("optionalRequire", function () {
    it("should provide default require function", () => {
      expect(optionalRequire("chai")).toBeTruthy();
    });

    it("should return undefined when module is not found", () => {
      expect(makeOptionalRequire(require)("not-found")).toBeUndefined();
    });

    it("should throw error for module that require a missing module", () => {
      expect(() => makeOptionalRequire(require)("../data/bad.cjs")).toThrow();
    });

    it("should throw error for error module", () => {
      expect(() => makeOptionalRequire(require)("../data/error.cjs")).toThrow();
    });

    it("should log default message when module is not found", () => {
      expect(makeOptionalRequire(require)("not-found", true)).toBeUndefined();
    });

    it("should log optional message when module is not found", () => {
      expect(makeOptionalRequire(require)("not-found", "test")).toBeUndefined();
    });

    it("should return a good module", () => {
      expect(makeOptionalRequire(require)("chai")).toBeTruthy();
    });

    it("should return a good relative module", () => {
      expect(makeOptionalRequire(require)("../data/good.cjs")).toBe("hello");
    });

    it("should call fail", () => {
      let failed;
      makeOptionalRequire(require)("../data/error.cjs", {
        fail: (e) => {
          failed = e;
        },
      });
      expect(failed).toBeTruthy();
    });

    it("should call notFound", () => {
      let notFound;
      makeOptionalRequire(require)("not-found", {
        notFound: (e) => {
          notFound = e;
          return {};
        },
      });
      expect(notFound).toBeTruthy();
    });

    it("should return default", () => {
      expect(makeOptionalRequire(require)("not-found", { default: "hello" })).toBe("hello");
    });

    it("should throw if notFound and default both are set in options", () => {
      expect(() => makeOptionalRequire(require)("", { notFound: () => 1, default: 1 })).toThrow();
    });
  });

  describe("tryResolve", function () {
    it("should return undefined when module is not found", () => {
      expect(tryResolve(require, "not-found", "resolve")).toBeUndefined();
    });

    it("should return path to a good module", () => {
      expect(tryResolve(require, "chai")).toBe(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(tryResolve(require, "../data/good.cjs")).toBe(require.resolve("../data/good.cjs"));
    });
  });

  describe("optionalRequire.resolve", function () {
    it("should return undefined when module is not found", () => {
      expect(makeOptionalRequire(require).resolve("not-found", "resolve")).toBeUndefined();
    });

    it("should return path to a good module", () => {
      expect(makeOptionalRequire(require).resolve("chai")).toBe(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(makeOptionalRequire(require).resolve("../data/good.cjs")).toBe(require.resolve("../data/good.cjs"));
    });
  });

  describe("with require-at", function () {
    it("should return undefined when module is not found", () => {
      expect(makeOptionalRequire(require).resolve("not-found", "resolve")).toBeUndefined();
    });

    it("should return path to a good module", () => {
      expect(makeOptionalRequire(require).resolve("chai")).toBe(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(makeOptionalRequire(require).resolve("../data/good.cjs")).toBe(require.resolve("../data/good.cjs"));
    });
  });

  describe("optionalRequire.log", function () {
    it.skip("should set default log", () => {
      let message;
      let _path;
      const myLog = (msg, p) => {
        message = msg;
        _path = p;
      };
      optionalRequire.log = myLog;
      expect(optionalRequire.log).toBe(myLog);
      // default to not log
      tryRequire(require, "nothing");
      expect(message).toBeUndefined();
      expect(_path).toBeUndefined();
      // true logs
      tryRequire(require, "nothing", true);
      expect(message).toBeTruthy();
      expect(_path).toBe("nothing");
    });
  });

  describe("Yarn Berry PnP", function () {
    const pnpMockRequire = (name) => {
      const err: NodeJS.ErrnoException = new Error(`Your application tried to access ${name.split("/")[0]}, `);
      err.code = "MODULE_NOT_FOUND";
      throw err;
    };

    it("should handle Yarn Berry PnP error messages", () => {
      expect(tryRequire(pnpMockRequire as unknown as NodeJS.Require, "foo")).toBeUndefined();
      expect(tryRequire(pnpMockRequire as unknown as NodeJS.Require, "foo/package.json")).toBeUndefined();
    });
  });
});
