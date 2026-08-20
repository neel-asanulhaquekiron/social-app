import { formatShortDate } from "@/helpers/date";

describe("formatShortDate", () => {
  const now = new Date("2026-08-20T00:00:00Z");

  it("formats a same-year timestamp without the year", () => {
    expect(formatShortDate("2026-08-20T08:05:43.123456+00:00", now)).toBe(
      "Aug 20",
    );
  });

  it("includes the year for a different year", () => {
    // A bare "Aug 20" on a two-year-old post reads as recent.
    expect(formatShortDate("2024-08-20T08:05:43.123456+00:00", now)).toBe(
      "Aug 20, 2024",
    );
  });

  it("accepts a Date", () => {
    expect(formatShortDate(new Date("2026-12-25T12:00:00Z"), now)).toBe(
      "Dec 25",
    );
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
