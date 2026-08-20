const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const PostValidator = require("../validators/validator.post");
const postController = require("../controllers/post.controller.js");

router.post(
  "/",
  auth,
  validate(PostValidator.createPostSchema),
  asyncHandler(postController.createOrUpdatePost),
);

// Public, but a valid token is used when present so `likedByMe` is accurate.
router.get(
  "/",
  auth.optional,
  validate(PostValidator.fetchPostsQuerySchema, "query"),
  asyncHandler(postController.fetchPosts),
);

router.get(
  "/:postId",
  auth.optional,
  validate(PostValidator.postIdParamsSchema, "params"),
  asyncHandler(postController.fetchPostById),
);

router.get(
  "/:postId/comments",
  validate(PostValidator.postIdParamsSchema, "params"),
  validate(PostValidator.fetchCommentsQuerySchema, "query"),
  asyncHandler(postController.fetchComments),
);

router.post(
  "/:postId/like",
  auth,
  validate(PostValidator.likePostParamsSchema, "params"),
  asyncHandler(postController.createPostLike),
);

router.delete(
  "/:postId/like",
  auth,
  validate(PostValidator.likePostParamsSchema, "params"),
  asyncHandler(postController.removePostLike),
);

router.post(
  "/:postId/comment",
  auth,
  validate(PostValidator.createCommentParamsSchema, "params"),
  validate(PostValidator.createCommentBodySchema),
  asyncHandler(postController.createComment),
);

router.delete(
  "/:postId/comment/:commentId",
  auth,
  validate(PostValidator.deleteCommentParamsSchema, "params"),
  asyncHandler(postController.deleteComment),
);

module.exports = router;
