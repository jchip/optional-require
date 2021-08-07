import { optionalRequire, makeOptionalRequire, tryRequire, tryResolve } from "../../src";

import legacyOptionalRequire from "../..";

import { expect } from "chai";

describe("optional-require ts", function () {
  it("should return undefined when module is not found", () => {
    expect(optionalRequire("not-round")).to.be.undefined;
  });

  it("should return a good module", () => {
    expect(optionalRequire("chai")).to.be.ok;
  });

  it("should return a good relative module", () => {
    expect(optionalRequire("../data/good", { require })).to.equal("hello");
  });

  it("should work with old export", () => {
    expect(legacyOptionalRequire(require)("chai"));
  });

  describe("from makeOptionalRequire", function () {
    const myOptionalRequire = makeOptionalRequire(require);

    it("should return undefined when module is not found", () => {
      expect(myOptionalRequire("not-round")).to.be.undefined;
    });

    it("should return a good module", () => {
      expect(myOptionalRequire("chai")).to.be.ok;
    });

    it("should return a good relative module", () => {
      expect(myOptionalRequire("../data/good")).to.equal("hello");
    });
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
});
