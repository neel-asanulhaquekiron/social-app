// Keyset ("cursor") pagination helpers.
//
// Every paginated list is ordered by (created_at desc, id desc), which is a
// unique, stable ordering — so a cursor is just the last row's sort key.
// Unlike OFFSET, rows inserted while the user scrolls can't cause skips or
// duplicates, and the database never scans the pages already delivered.

const encodeCursor = (row) =>
  Buffer.from(`${row.created_at}|${row.id}`).toString("base64url");

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const separator = raw.lastIndexOf("|");
    if (separator === -1) return null;

    const createdAt = raw.slice(0, separator);
    const id = Number(raw.slice(separator + 1));

    if (!createdAt || !Number.isInteger(id)) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
};

/**
 * Restricts a PostgREST query to rows strictly after the cursor. An unusable
 * cursor is ignored (the caller just gets the first page) rather than 500ing.
 */
const applyKeyset = (query, cursor) => {
  const decoded = decodeCursor(cursor);
  if (!decoded) return query;

  // Quoted because timestamps contain '+' and ':'.
  return query.or(
    `created_at.lt."${decoded.createdAt}",` +
      `and(created_at.eq."${decoded.createdAt}",id.lt.${decoded.id})`,
  );
};

const ordered = (query) =>
  query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

/**
 * Splits an over-fetched result (limit + 1 rows) into a page plus the cursor
 * for the next one. `nextCursor` is null when the list is exhausted, which is
 * what tells the client to stop — no more guessing from array lengths.
 */
const toPage = (rows, limit) => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last) : null,
  };
};

module.exports = { encodeCursor, decodeCursor, applyKeyset, ordered, toPage };
