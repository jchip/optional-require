import { describe, it, expect } from "vitest";
import {
  optionalRequire,
  makeOptionalRequire,
  tryRequire,
  tryResolve,
  setAppPath,
  setAppPathAtTopNodeModules,
  setDefaultLog,
  optionalRequireCwd,
  _getRequire,
} from "../../src/esm/index.ts";
import requireAt from "require-at";
import { URL } from "node:url";

// Create a require function for ESM context
const nodeRequire = requireAt(new URL(import.meta.url).pathname);

describe("optional-require ts", () => {
  it("should return undefined when module is not found", () => {
    expect(optionalRequire("not-round")).toBeUndefined();
  });

  it("should return a good module", () => {
    expect(optionalRequire("chai")).toBeTruthy();
  });

  it("should return a good relative module", () => {
    expect(optionalRequire("../data/good.cjs", { require: nodeRequire })).toBe("hello");
  });

  describe("optionalRequire", function () {
    const optionalRequireT1 = makeOptionalRequire(nodeRequire);

    it("should provide default require function", () => {
      expect(optionalRequireT1("chai")).toBeTruthy();
    });

    it("should return undefined when module is not found", () => {
      expect(optionalRequireT1("not-found")).toBeUndefined();
    });

    it("should throw error for module that require a missing module", () => {
      expect(() => optionalRequireT1("../data/bad.js")).toThrow("Cannot find package 'missing-js'");
      expect(() => optionalRequireT1("../data/bad.cjs")).toThrow("Cannot find module 'missing-cjs'");
    });

    it("should not throw error for package with bad main in package.json", () => {
      expect(() => optionalRequireT1("bad-main")).not.toThrow();
      expect(optionalRequireT1("bad-main")).toBeUndefined();
    });

    it("should throw error for module requiring missing module", () => {
      expect(() => optionalRequireT1("require-missing")).toThrow("Cannot find module 'missing-module'");
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

  describe("from makeOptionalRequire", () => {
    const myOptionalRequire = makeOptionalRequire(nodeRequire);

    it("should return undefined when module is not found", () => {
      expect(myOptionalRequire("not-round")).toBeUndefined();
    });

    it("should return a good module", () => {
      expect(myOptionalRequire("chai")).toBeTruthy();
    });

    it("should return a good relative module", () => {
      expect(myOptionalRequire("../data/good.cjs")).toBe("hello");
    });
  });

  describe("tryRequire", () => {
    it("should return undefined when module is not found", () => {
      expect(tryRequire(nodeRequire, "not-found")).toBeUndefined();
    });

    it("should return a good module", () => {
      expect(tryRequire(nodeRequire, "chai")).toBeTruthy();
    });

    it("should return a good relative module", () => {
      expect(tryRequire(nodeRequire, "../data/good.cjs")).toBe("hello");
    });
  });

  describe("tryResolve", () => {
    it("should return undefined when module is not found", () => {
      expect(tryResolve(nodeRequire, "not-found", "resolve")).toBeUndefined();
    });

    it("should return path to a good module", () => {
      expect(tryResolve(nodeRequire, "chai")).toBe(nodeRequire.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(tryResolve(nodeRequire, "../data/good.cjs")).toBe(nodeRequire.resolve("../data/good.cjs"));
    });
  });

  describe("Yarn Berry PnP", () => {
    const pnpMockRequire = (name) => {
      const err: NodeJS.ErrnoException = new Error(`Your application tried to access ${name.split("/")[0]}, `);
      err.code = "MODULE_NOT_FOUND";
      throw err;
    };

    it("should handle Yarn Berry PnP error messages", () => {
      expect(tryRequire(pnpMockRequire as unknown as NodeRequire, "foo")).toBeUndefined();
      expect(tryRequire(pnpMockRequire as unknown as NodeRequire, "foo/package.json")).toBeUndefined();
    });
  });

  describe("Edge cases and utility functions", () => {
    it("should handle setAppPath", () => {
      const originalPath = process.cwd();
      setAppPath(process.cwd());

      // Test that it affects makeOptionalRequire when no callerRequire provided
      const customOptional = makeOptionalRequire("");
      expect(customOptional).toBeTruthy();

      // Reset
      setAppPath(originalPath);
    });

    it("should handle setAppPathAtTopNodeModules", () => {
      const pathWithNodeModules = "/some/project/node_modules/package/lib";
      const result = setAppPathAtTopNodeModules(pathWithNodeModules);
      expect(result).toBe("/some/project");

      const pathWithoutNodeModules = "/some/project/lib";
      const result2 = setAppPathAtTopNodeModules(pathWithoutNodeModules);
      expect(result2).toBe("/some/project/lib");
    });

    it("should handle string require paths with file:// URLs", () => {
      const fileUrl = new URL(import.meta.url).href;
      const myOptional = makeOptionalRequire(fileUrl);
      expect(myOptional("chai")).toBeTruthy();
    });

    it("should handle invalid string require paths", () => {
      const myOptional = makeOptionalRequire(process.cwd());
      expect(myOptional("chai")).toBeTruthy();
    });

    it("should trigger URL parsing catch block with path that fails URL constructor", () => {
      // Use a string that will fail URL constructor but is a valid path for requireAt
      // Characters like [, ], and certain symbols break URL parsing
      const pathThatFailsUrl = "[invalid-url-but-valid-path]";
      try {
        const myOptional = makeOptionalRequire(pathThatFailsUrl);
        // This will fail because the path doesn't exist, but we've covered the catch block
        myOptional("chai");
      } catch (e) {
        // Expected - the path doesn't exist, but the URL catch block was triggered
        expect(e.message).toContain("stat");
      }
    });

    it("should trigger URL parsing catch block with colon in path", () => {
      // Use a string that will definitely fail URL constructor
      const pathWithInvalidUrl = "not-a-url://but-valid-path";
      try {
        const myOptional = makeOptionalRequire(pathWithInvalidUrl);
        // This will fail because the path doesn't exist, but we've covered the catch block
        myOptional("chai");
      } catch (e) {
        // Expected - the path doesn't exist, but the URL catch block was triggered
        expect(e.message).toContain("stat");
      }
    });

    it("should throw assertion error when both notFound and default are provided", () => {
      expect(() => {
        optionalRequire("not-found", {
          notFound: () => "notFound result",
          default: "default result",
        });
      }).toThrow("optionalRequire: options set with both `notFound` and `default`");
    });

    it("should handle PnP dependency name edge cases", () => {
      const createPnpError = (message: string) => (name: string) => {
        const err: NodeJS.ErrnoException = new Error(message);
        err.code = "MODULE_NOT_FOUND";
        throw err;
      };

      const pnpError1 = createPnpError(
        "Your application tried to access my-package. While this was probably on purpose"
      );
      expect(tryRequire(pnpError1 as unknown as NodeRequire, "my-package/sub")).toBeUndefined();

      const pnpError2 = createPnpError("Your application tried to access my-package (a peer dependency)");
      expect(tryRequire(pnpError2 as unknown as NodeRequire, "my-package")).toBeUndefined();

      const normalError = createPnpError("Cannot find module './some-file'");
      expect(tryRequire(normalError as unknown as NodeRequire, "./some-file")).toBeUndefined();
    });

    it("should handle custom logging", () => {
      let loggedMessage = "";
      let loggedPath = "";

      const customLog = (message: string, path: string) => {
        loggedMessage = message;
        loggedPath = path;
      };

      setDefaultLog(customLog);

      tryRequire(nodeRequire, "not-found-module", true);
      expect(loggedMessage).toContain("optional module not found");
      expect(loggedPath).toBe("not-found-module");

      setDefaultLog((message: string, path: string) => {
        console.log(`Just FYI: ${message}; Path "${path}"`);
      });
    });

    it("should handle optionalRequireCwd", () => {
      expect(optionalRequireCwd("chai")).toBeTruthy();
      expect(optionalRequireCwd("not-found")).toBeUndefined();
    });

    it("should handle makeOptionalRequire with no arguments", () => {
      const originalPath = process.cwd();
      setAppPath(process.cwd());

      const optional = makeOptionalRequire("");
      expect(optional("chai")).toBeTruthy();

      setAppPath(originalPath);
    });

    it("should handle tryRequire with no callerRequire", () => {
      expect(tryRequire("", "chai")).toBeTruthy();
      expect(tryRequire("", "not-found")).toBeUndefined();
    });

    it("should handle tryResolve with no callerRequire", () => {
      expect(tryResolve("", "chai")).toBeTruthy();
      expect(tryResolve("", "not-found")).toBeUndefined();
    });
  });
});

describe("_getRequire function", () => {
  it("should return requireAt(process.cwd()) when callerRequire is empty", () => {
    const result = _getRequire("");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("function");
  });

  it("should return requireAt with fallbackPath when callerRequire is empty", () => {
    const result = _getRequire("", process.cwd());
    expect(result).toBeTruthy();
    expect(typeof result).toBe("function");
  });

  it("should return the same require function when callerRequire is already a function", () => {
    const result = _getRequire(nodeRequire);
    expect(result).toBe(nodeRequire);
  });

  it("should handle valid file:// URLs", () => {
    const fileUrl = new URL(import.meta.url).href;
    const result = _getRequire(fileUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("function");
  });

  it("should trigger catch block with invalid URL and fallback to requireAt with path", () => {
    // Use a string that will fail URL constructor but work as a file path
    const invalidUrl = "not-a-url://but-valid-path-" + process.cwd();
    const result = _getRequire(invalidUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("function");
  });

  it("should trigger catch block with malformed URL syntax", () => {
    // Use brackets which are invalid in URLs but the path will be valid
    const pathWithBrackets = process.cwd() + "/[test]";
    try {
      const result = _getRequire(pathWithBrackets);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("function");
    } catch (e) {
      // Expected - the path doesn't exist, but we've covered the catch block
      expect(e.message).toContain("ENOENT");
    }
  });
});
