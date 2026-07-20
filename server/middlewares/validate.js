module.exports = (schema, location = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    // Replace req.body with validated data
    req[location] = result.data;

    next();
  };
};
