// Every timestamp in the UI is a short date, which Intl does natively — so
// this replaces moment (~300 KB) with no dependency at all. Hermes ships full
// ICU, so Intl.DateTimeFormat is available on device.
const sameYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const otherYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * "Aug 20" for the current year, "Aug 20, 2025" otherwise — a bare "Aug 20"
 * on a two-year-old post is actively misleading. Empty string for a missing
 * or unparseable value.
 *
 * `now` is injectable so the year behaviour can be tested without depending
 * on the system clock.
 */
export const formatShortDate = (
  value?: string | number | Date | null,
  now: Date = new Date(),
): string => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter =
    date.getFullYear() === now.getFullYear() ? sameYear : otherYear;

  return formatter.format(date);
};
