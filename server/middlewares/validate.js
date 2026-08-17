// Validates req[location] against a zod schema.
//
// Parsed (and coerced) data is stored on req.validated[location]. For "body"
// and "params" it also replaces req[location]; req.query is a getter in
// Express 5 and cannot be reassigned, so controllers must read coerced query
// values from req.validated.query.
module.exports = (schema, location = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        code: "bad_request",
        errors: result.error.flatten(),
      });
    }

    req.validated = { ...(req.validated || {}), [location]: result.data };
    if (location !== "query") {
      req[location] = result.data;
    }

    next();
  };
};
