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
  });

  describe("resolve", function () {
    it("should return undefined when module is not found", () => {
      expect(optionalRequire(require).resolve("not-found")).to.be.undefined;
    });
  });
});

