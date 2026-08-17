const { z } = require("zod");

class NotificationValidator {
  static createNotificationSchema = z.object({
    receiverId: z.string().uuid(),
    title: z.string().trim().min(1).max(120),
    // JSON-encoded string, e.g. {"postId":1,"commentId":2}
    data: z
      .string()
      .max(2000)
      .refine(
        (value) => {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
        { message: "data must be a JSON string" },
      )
      .optional(),
  });

  static notificationIdParamsSchema = z.object({
    notificationId: z.coerce.number().int().positive(),
  });
}

module.exports = NotificationValidator;
