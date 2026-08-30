import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withOrgScope, withSingleOrgScope, assertResourceOrg } from "./orgScope.js";
import { AppError } from "./errors.js";

describe("withOrgScope", () => {
  it("injects an organizationId $in filter, preserving the rest", () => {
    const a = new Types.ObjectId().toString();
    const b = new Types.ObjectId().toString();
    const f = withOrgScope({ boardId: "x" }, [a, b]);
    expect(f.boardId).toBe("x");
    expect(f.organizationId.$in).toHaveLength(2);
    expect(f.organizationId.$in[0]).toBeInstanceOf(Types.ObjectId);
    expect(f.organizationId.$in.map(String)).toEqual([a, b]);
  });
});

describe("withSingleOrgScope", () => {
  it("pins organizationId to one id", () => {
    const id = new Types.ObjectId().toString();
    const f = withSingleOrgScope({ name: "p" }, id);
    expect(String(f.organizationId)).toBe(id);
  });
});

describe("assertResourceOrg", () => {
  it("passes when the resource org is one the caller belongs to", () => {
    const id = new Types.ObjectId().toString();
    expect(() => assertResourceOrg(id, [id, "other"])).not.toThrow();
  });

  it("throws an indistinguishable 404 for a cross-tenant resource", () => {
    const resourceOrg = new Types.ObjectId().toString();
    try {
      assertResourceOrg(resourceOrg, ["some-other-org"]);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe("NOT_FOUND");
    }
  });
});
