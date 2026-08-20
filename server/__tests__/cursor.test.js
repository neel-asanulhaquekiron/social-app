const { encodeCursor, decodeCursor, toPage } = require("../utils/cursor");

describe("cursor encoding", () => {
  it("round-trips a row's sort key", () => {
    const row = { created_at: "2026-08-20T08:05:43.123456+00:00", id: 42 };
    const decoded = decodeCursor(encodeCursor(row));

    expect(decoded).toEqual({ createdAt: row.created_at, id: 42 });
  });

  it("survives timestamps containing the separator-adjacent characters", () => {
    const row = { created_at: "2026-01-01T00:00:00+00:00", id: 7 };
    expect(decodeCursor(encodeCursor(row)).id).toBe(7);
  });

  it.each([
    ["null", null],
    ["empty", ""],
    ["not base64", "!!!!"],
    ["base64 without a separator", Buffer.from("nope").toString("base64url")],
    ["non-numeric id", Buffer.from("2026-01-01|abc").toString("base64url")],
  ])("returns null for a %s cursor rather than throwing", (_label, value) => {
    expect(decodeCursor(value)).toBeNull();
  });
});

describe("toPage", () => {
  const rows = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      created_at: `2026-08-${String(20 - i).padStart(2, "0")}T00:00:00+00:00`,
    }));

  it("trims the over-fetched row and returns a cursor when more exist", () => {
    const { items, nextCursor } = toPage(rows(4), 3);

    expect(items).toHaveLength(3);
    expect(nextCursor).not.toBeNull();
    // The cursor points at the last *returned* row, not the extra one.
    expect(decodeCursor(nextCursor).id).toBe(3);
  });

  it("returns a null cursor on the last page", () => {
    const { items, nextCursor } = toPage(rows(2), 3);

    expect(items).toHaveLength(2);
    expect(nextCursor).toBeNull();
  });

  it("handles an empty result", () => {
    expect(toPage([], 10)).toEqual({ items: [], nextCursor: null });
  });

  it("returns a null cursor when the page is exactly full", () => {
    // Exactly `limit` rows means there was no extra row, so no next page.
    expect(toPage(rows(3), 3).nextCursor).toBeNull();
  });
});
