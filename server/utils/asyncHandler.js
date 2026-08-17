// Wraps an async route handler so any thrown error reaches the JSON error
// handler instead of Express's default HTML error page.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
