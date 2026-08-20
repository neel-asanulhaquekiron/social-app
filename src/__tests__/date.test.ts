import { formatShortDate } from "@/helpers/date";

describe("formatShortDate", () => {
  it("formats an ISO timestamp as 'MMM D'", () => {
    expect(formatShortDate("2026-08-20T08:05:43.123456+00:00")).toBe("Aug 20");
  });

  it("accepts a Date", () => {
    expect(formatShortDate(new Date("2026-12-25T12:00:00Z"))).toBe("Dec 25");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty string", ""],
  ])("returns an empty string for %s", (_label, value) => {
    // moment(undefined) silently meant "now"; this must not invent a date.
    expect(formatShortDate(value as any)).toBe("");
  });

  it("returns an empty string for an unparseable value", () => {
    expect(formatShortDate("not-a-date")).toBe("");
  });
});
