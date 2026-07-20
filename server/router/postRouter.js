const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Post = require("../models/post.js");
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

router.post("/:postId/comment", async (req, res) => {
  const { postId } = req.params;
  const commentData = req.body;

  if (!postId || !commentData.userId || !commentData.text) {
    return res.status(400).json({
      success: false,
      msg: "Missing postId, userId, or text in request",
    });
  }

  try {
    const result = await Post.createComment({ ...commentData, postId });
    res.json(result);
  } catch (error) {
    console.error("Error creating comment:", error);
    res
      .status(500)
      .json({ success: false, msg: error.message || "Something went wrong" });
  }
});

router.delete("/:postId/comment/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;

  if (!postId || !commentId) {
    return res
      .status(400)
      .json({ success: false, msg: "Missing postId or commentId" });
  }

  try {
    const result = await Post.deleteComment(commentId);
    res.json(result);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res
      .status(500)
      .json({ success: false, msg: error.message || "Something went wrong" });
  }
});

module.exports = router;
