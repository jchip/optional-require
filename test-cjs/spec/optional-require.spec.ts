import { describe, it, expect, afterAll } from "vitest";
import { createRequire } from "node:module";
import { optionalRequire, makeOptionalRequire, tryRequire, tryResolve } from "../../src/cjs/index.ts";
import path from "node:path";

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
    const optionalRequireT1 = makeOptionalRequire(require);

    it("should provide default require function", () => {
      expect(optionalRequire("chai")).toBeTruthy();
    });

    it("should return undefined when module is not found", () => {
      expect(optionalRequireT1("not-found")).toBeUndefined();
    });

    it("should throw error for module that require a missing module", () => {
      expect(() => optionalRequireT1("../data/bad.cjs")).toThrow();
    });

    it("should not throw error for package with bad main in package.json", () => {
      expect(() => optionalRequireT1("bad-main")).not.toThrow();
    });

    it("should throw error for module requiring missing module", () => {
      expect(() => optionalRequireT1("require-missing")).toThrow("Cannot find module 'missing-module'");
    });

    it("should throw error for package that requires missing module", () => {
      expect(() => optionalRequireT1("proxy-to-missing")).toThrow("Cannot find module 'missing-module'");
    });

    it("should throw error for error module", () => {
      expect(() => optionalRequireT1("../data/error.cjs")).toThrow();
    });

    it("should log default message when module is not found", () => {
      expect(optionalRequireT1("not-found", true)).toBeUndefined();
    });

    it("should log optional message when module is not found", () => {
      expect(optionalRequireT1("not-found", "test")).toBeUndefined();
    });

    it("should return a good module", () => {
      expect(optionalRequireT1("chai")).toBeTruthy();
    });

    it("should return a good relative module", () => {
      expect(optionalRequireT1("../data/good.cjs")).toBe("hello");
    });

    it("should call fail", () => {
      let failed;
      optionalRequireT1("../data/error.cjs", {
        fail: (e) => {
          failed = e;
        },
      });
      expect(failed).toBeTruthy();
    });

    it("should call notFound", () => {
      let notFound;
      optionalRequireT1("not-found", {
        notFound: (e) => {
          notFound = e;
          return {};
        },
      });
      expect(notFound).toBeTruthy();
    });

    it("should return default", () => {
      expect(optionalRequireT1("not-found", { default: "hello" })).toBe("hello");
    });

    it("should throw if notFound and default both are set in options", () => {
      expect(() => optionalRequireT1("", { notFound: () => 1, default: 1 })).toThrow();
    });
  });

  describe("optionalRequire.resolvePath", () => {
    const optionalRequireT1 = makeOptionalRequire(require);

    it("should return absolute path", () => {
      const result = optionalRequireT1.resolvePath("/a/b/c");
      expect(result).toBe("/a/b/c");
    });

    it("should return relative path", () => {
      const result = optionalRequireT1.resolvePath("../data/good.cjs");
      expect(result).toBe(require.resolve("../data/good.cjs"));
    });

    it("should return the resolved path", () => {
      const result = optionalRequireT1.resolvePath("typescript");
      expect(result).toBe(require.resolve("typescript"));
    });

    it("should return the resolved path for package with bad main in package.json", () => {
      const result = optionalRequireT1.resolvePath("bad-main");
      expect(result).toContain(path.join(process.cwd(), "node_modules", "bad-main"));
    });

    it("should throw when requires proxy-to-bad-main/something", () => {
      expect(optionalRequireT1.resolvePath("proxy-to-bad-main/something")).toContain(
        "/test-cjs/spec/node_modules/proxy-to-bad-main"
      );
    });

    it("should return the resolved path for package with syntax error", () => {
      const result = optionalRequireT1.resolvePath("syntax-error");
      expect(result).toContain(path.join(process.cwd(), "node_modules", "syntax-error"));
    });

    it("should fail if failed with error other than MODULE_NOT_FOUND", () => {
      // trigger failure with non-string path
      expect(() => optionalRequireT1.resolvePath(999 as any)).toThrow();
    });

    it("should fail if package doesn't exist in node_modules", () => {
      expect(optionalRequireT1.resolvePath("not-exist-blah-foo-bar")).toContain(
        "/test-cjs/spec/node_modules/not-exist-blah-foo-bar"
      );
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
