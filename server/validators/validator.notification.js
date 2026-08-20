const { z } = require("zod");

class NotificationValidator {
  static notificationIdParamsSchema = z.object({
    notificationId: z.coerce.number().int().positive(),
  });

  /**
   * GET /notifications?limit=20&cursor=<opaque>
   */
  static listQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(50).optional(),
    cursor: z.string().trim().max(200).optional(),
  });
}

module.exports = NotificationValidator;
