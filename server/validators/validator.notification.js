const { z } = require("zod");

class NotificationValidator {
  static notificationIdParamsSchema = z.object({
    notificationId: z.coerce.number().int().positive(),
  });
}

module.exports = NotificationValidator;
