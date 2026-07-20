const { z } = require("zod");

class PostValidator {
  /**
   * POST /posts
   */
  static createPostSchema = z.object({
    body: z
      .string()
      .trim()
      .min(1, "Post body is required")
      .max(3000, "Post body is too long"),
  });

  /**
   * GET /posts?limit=10&username=john
   */
  static fetchPostsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    username: z.string().trim().optional(),
  });

  /**
   * GET /posts/:postId
   */
  static postIdParamsSchema = z.object({
    postId: z.coerce.number().int().positive(),
  });

  /**
   * POST /posts/:postId/like
   * DELETE /posts/:postId/like
   */
  static likePostParamsSchema = z.object({
    postId: z.coerce.number().int().positive(),
  });

  /**
   * POST /posts/:postId/comment
   */
  static createCommentParamsSchema = z.object({
    postId: z.coerce.number().int().positive(),
  });

  static createCommentBodySchema = z.object({
    text: z
      .string()
      .trim()
      .min(1, "Comment cannot be empty")
      .max(500, "Comment cannot exceed 500 characters"),
  });

  /**
   * DELETE /posts/:postId/comment/:commentId
   */
  static deleteCommentParamsSchema = z.object({
    postId: z.coerce.number().int().positive(),
    commentId: z.coerce.number().int().positive(),
  });
}

module.exports = PostValidator;
