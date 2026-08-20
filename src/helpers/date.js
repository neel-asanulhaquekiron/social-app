// Every timestamp in the UI is the same "MMM D" short form, which Intl does
// natively — so this replaces moment (~300 KB) with no dependency at all.
// Hermes ships full ICU, so Intl.DateTimeFormat is available on device.
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** "Aug 20", or an empty string for a missing/unparseable value. */
export const formatShortDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return shortDate.format(date);
};
