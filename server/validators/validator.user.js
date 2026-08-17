const { z } = require("zod");

class UserValidator {
  static userIdParamsSchema = z.object({
    userId: z.string().uuid(),
  });

  static registerPushTokenSchema = z.object({
    userId: z.string().uuid(),
    pushToken: z.string().min(1),
  });
}

module.exports = UserValidator;
