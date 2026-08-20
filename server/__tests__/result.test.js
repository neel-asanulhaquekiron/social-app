const { ok, fail, dbError, sendResult } = require("../utils/result");

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("result helpers", () => {
  it("ok() marks success and carries the payload", () => {
    expect(ok({ data: [1, 2] })).toEqual({ success: true, data: [1, 2] });
  });

  it("fail() carries a message and a code", () => {
    expect(fail("nope", "not_found")).toEqual({
      success: false,
      msg: "nope",
      code: "not_found",
    });
  });

  it.each([
    ["23503", "not_found"],
    ["23505", "conflict"],
  ])("maps Postgres %s to %s", (pgCode, expected) => {
    expect(dbError("x", { code: pgCode }).code).toBe(expected);
  });

  it("includes the raw database message in development, for debugging", () => {
    // NODE_ENV=test counts as dev, which is why this suite sees raw text.
    const result = dbError("fetching posts", {
      code: "42501",
      message: "permission denied for relation posts",
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain("permission denied");
  });

  it("does not leak raw database messages in production", () => {
    jest.isolateModules(() => {
      jest.doMock("../config/env", () => ({
        ...jest.requireActual("../config/env"),
        isDev: false,
        isProd: true,
      }));

      const { dbError: prodDbError } = require("../utils/result");
      const result = prodDbError("fetching posts", {
        code: "42501",
        message: "permission denied for relation posts",
      });

      expect(result.success).toBe(false);
      expect(result.msg).not.toContain("permission denied");
      expect(result.msg).not.toContain("posts");
    });
  });

  it.each([
    ["bad_request", 400],
    ["unauthorized", 401],
    ["forbidden", 403],
    ["not_found", 404],
    ["conflict", 409],
    ["server_error", 500],
  ])("sendResult maps %s to HTTP %i", (code, status) => {
    const res = mockRes();
    sendResult(res, fail("msg", code));

    expect(res.status).toHaveBeenCalledWith(status);
  });

  it("sendResult uses the provided success status", () => {
    const res = mockRes();
    sendResult(res, ok({ data: 1 }), 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: 1 });
  });
});
