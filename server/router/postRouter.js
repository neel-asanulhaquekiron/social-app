const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const PostValidator = require("../validators/validator.post");
const postController = require("../controllers/post.controller.js");

router.post(
  "/",
  auth,
  validate(PostValidator.createPostSchema),
  postController.createOrUpdatePost,
);

router.get(
  "/",
  validate(PostValidator.fetchPostsQuerySchema, "query"),
  postController.fetchPosts,
);

router.get(
  "/:postId",
  validate(PostValidator.postIdParamsSchema, "params"),
  postController.fetchPostById,
);

router.post(
  "/:postId/like",
  auth,
  validate(PostValidator.likePostParamsSchema, "params"),
  postController.createPostLike,
);

router.delete(
  "/:postId/like",
  auth,
  validate(PostValidator.likePostParamsSchema, "params"),
  postController.removePostLike,
);

router.post(
  "/:postId/comment",
  auth,
  validate(PostValidator.createCommentParamsSchema, "params"),
  validate(PostValidator.createCommentBodySchema),
  postController.createComment,
);

router.delete(
  "/:postId/comment/:commentId",
  auth,
  validate(PostValidator.deleteCommentParamsSchema, "params"),
  postController.deleteComment,
);

module.exports = router;
