"use strict";

/* eslint-disable @typescript-eslint/no-var-requires */

const optionalRequire = require("../..");
const chai = require("chai");
const expect = chai.expect;

const { tryRequire, tryResolve } = optionalRequire;

describe("optional-require", function () {
  const saveCwd = process.cwd();

  after(() => {
    process.chdir(saveCwd);
  });

  describe("tryRequire", function () {
    it("should return undefined when module is not found", () => {
      expect(tryRequire(require, "not-found")).to.be.undefined;
    });

    it("should return a good module", () => {
      expect(tryRequire(require, "chai")).to.be.ok;
    });

    it("should return a good relative module", () => {
      expect(tryRequire(require, "../data/good")).to.equal("hello");
    });
  });

  describe("optionalRequire", function () {
    it("should return undefined when module is not found", () => {
      expect(optionalRequire(require)("not-found")).to.be.undefined;
    });

    it("should throw error for bad module", () => {
      expect(() => optionalRequire(require)("../data/bad")).to.throw();
    });

    it("should throw error for error module", () => {
      expect(() => optionalRequire(require)("../data/error")).to.throw();
    });

    it("should log default message when module is not found", () => {
      expect(optionalRequire(require)("not-found", true)).to.be.undefined;
    });

    it("should log optional message when module is not found", () => {
      expect(optionalRequire(require)("not-found", "test")).to.be.undefined;
    });

    it("should return a good module", () => {
      expect(optionalRequire(require)("chai")).to.be.ok;
    });

    it("should return a good relative module", () => {
      expect(optionalRequire(require)("../data/good")).to.equal("hello");
    });

    it("should call fail", () => {
      let failed;
      optionalRequire(require)("../data/error", {
        fail: (e) => {
          failed = e;
        },
      });
      expect(failed).to.be.ok;
    });

    it("should call notFound", () => {
      let notFound;
      optionalRequire(require)("not-found", {
        notFound: (e) => {
          notFound = e;
          return {};
        },
      });
      expect(notFound).to.be.ok;
    });

    it("should return default", () => {
      expect(optionalRequire(require)("not-found", { default: "hello" })).to.equal("hello");
    });

    it("should throw if notFound and default both are set in options", () => {
      expect(() => optionalRequire(require)("", { notFound: () => 1, default: 1 })).to.throw();
    });
  });

  describe("tryResolve", function () {
    it("should return undefined when module is not found", () => {
      expect(tryResolve(require, "not-found", "resolve")).to.be.undefined;
    });

    it("should return path to a good module", () => {
      expect(tryResolve(require, "chai")).to.equal(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(tryResolve(require, "../data/good")).to.equal(require.resolve("../data/good"));
    });
  });

  describe("optionalRequire.resolve", function () {
    it("should return undefined when module is not found", () => {
      expect(optionalRequire(require).resolve("not-found", "resolve")).to.be.undefined;
    });

    it("should return path to a good module", () => {
      expect(optionalRequire(require).resolve("chai")).to.equal(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(optionalRequire(require).resolve("../data/good")).to.equal(require.resolve("../data/good"));
    });
  });

  describe("with require-at", function () {
    it("should return undefined when module is not found", () => {
      expect(optionalRequire(require).resolve("not-found", "resolve")).to.be.undefined;
    });

    it("should return path to a good module", () => {
      expect(optionalRequire(require).resolve("chai")).to.equal(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(optionalRequire(require).resolve("../data/good")).to.equal(require.resolve("../data/good"));
    });
  });

  describe("optionalRequire.log", function () {
    it("should set default log", () => {
      let message;
      let _path;
      const myLog = (msg, p) => {
        message = msg;
        _path = p;
      };
      optionalRequire.log = myLog;
      expect(optionalRequire.log).equal(myLog);
      // default to not log
      tryRequire(require, "nothing");
      expect(message).equal(undefined);
      expect(_path).equal(undefined);
      // true logs
      tryRequire(require, "nothing", true);
      expect(message).to.be.ok;
      expect(_path).equal("nothing");
    });
  });
});
