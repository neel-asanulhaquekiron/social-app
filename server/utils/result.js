// Small helpers so models return a consistent shape and controllers map it to
// HTTP status codes in one place.
//
//   ok(data)                    -> { success: true, ...data }
//   fail(msg, { code })         -> { success: false, msg, code }
//   dbError(context, error)     -> logs the real DB error, returns a sanitized failure
//   sendResult(res, result, ok) -> writes the right status code + JSON body

const isDev = ["development", "test"].includes(process.env.NODE_ENV);

const STATUS_BY_CODE = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  server_error: 500,
};

const ok = (data = {}) => ({ success: true, ...data });

const fail = (msg, code = "bad_request") => ({ success: false, msg, code });

// Never echo raw database/library messages to clients in production — they can
// reveal table/column names and constraint details. In dev keep them visible.
const dbError = (context, error) => {
  console.error(`Error ${context}:`, error);

  // Postgres error codes that map cleanly to client-facing statuses.
  if (error?.code === "23503") {
    return fail("Related record not found", "not_found"); // foreign key violation
  }
  if (error?.code === "23505") {
    return fail("Already exists", "conflict"); // unique violation
  }

  const msg = isDev
    ? `${context}: ${error?.message || "unknown error"}`
    : "Something went wrong";
  return { success: false, msg, code: "server_error" };
};

const sendResult = (res, result, okStatus = 200) => {
  if (result?.success) {
    return res.status(okStatus).json(result);
  }
  const status = STATUS_BY_CODE[result?.code] ?? 400;
  return res.status(status).json({
    success: false,
    msg: result?.msg || "Request failed",
    ...(result?.code ? { code: result.code } : {}),
    ...(result?.errors ? { errors: result.errors } : {}),
  });
};

module.exports = { ok, fail, dbError, sendResult, isDev };
