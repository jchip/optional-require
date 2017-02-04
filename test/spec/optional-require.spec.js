"use strict";

const optionalRequire = require("../..");
const chai = require("chai");
const expect = chai.expect;

describe("optional-require", function () {
  describe("require", function () {
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
  });

  describe("resolve", function () {
    it("should return undefined when module is not found", () => {
      expect(optionalRequire(require).resolve("not-found")).to.be.undefined;
    });

    it("should return path to a good module", () => {
      expect(optionalRequire(require).resolve("chai")).to.equal(require.resolve("chai"));
    });

    it("should return path to a good relative module", () => {
      expect(optionalRequire(require).resolve("../data/good")).to.equal(require.resolve("../data/good"));
    });
  });
});

