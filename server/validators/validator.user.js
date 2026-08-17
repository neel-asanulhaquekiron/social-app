const { z } = require("zod");

class UserValidator {
  static userIdParamsSchema = z.object({
    userId: z.string().uuid(),
  });

  static registerPushTokenSchema = z.object({
    pushToken: z.string().min(1).max(512),
  });
}

module.exports = UserValidator;
