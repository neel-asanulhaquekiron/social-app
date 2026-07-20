const { z } = require("zod");

class UserValidator {
  static userIdParamsSchema = z.object({
    userId: z.string().uuid(),
  });
}

module.exports = UserValidator;
