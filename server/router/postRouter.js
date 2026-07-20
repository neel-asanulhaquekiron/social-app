const express = require("express");
const router = express.Router();
const Post = require("../models/post.js");

router.post("/", async (req, res) => {
  const postData = req.body;
  const result = await Post.createOrUpdatePost(postData);
  res.json(result);
});

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const userName = req.query.username || null;
  const result = await Post.fetchPosts(limit, userName);
  res.json(result);
});

router.get("/:postId", async (req, res) => {
  const postId = req.params.postId;
  const result = await Post.fetchPostById(postId);
  res.json(result);
});

router.post("/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!postId || !userId) {
    return res
      .status(400)
      .json({ success: false, msg: "Missing postId or userId" });
  }

  try {
    const result = await Post.createPostLike({ postId, userId });
    res.json(result);
  } catch (error) {
    console.error("Error creating post like:", error);
    res
      .status(500)
      .json({ success: false, msg: error.message || "Something went wrong" });
  }
});

router.delete("/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!postId || !userId) {
    return res
      .status(400)
      .json({ success: false, msg: "Missing postId or userId" });
  }

  try {
    const result = await Post.removePostLike(postId, userId);
    res.json(result);
  } catch (error) {
    console.error("Error removing post like:", error);
    res
      .status(500)
      .json({ success: false, msg: error.message || "Something went wrong" });
  }
});

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
