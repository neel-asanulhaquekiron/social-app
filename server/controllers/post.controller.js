const Post = require("../models/post.js");

class PostController {
  static async createOrUpdatePost(req, res) {
    const postData = {
      ...req.body,
      userId: req.user.id,
    };

    const result = await Post.createOrUpdatePost(postData);

    res.json(result);
  }

  static async fetchPosts(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const userName = req.query.username || null;
    const result = await Post.fetchPosts(limit, userName);
    res.json(result);
  }

  static async fetchPostById(req, res) {
    const postId = req.params.postId;
    const result = await Post.fetchPostById(postId);
    res.json(result);
  }

  static async createPostLike(req, res) {
    const { postId } = req.params;
    const { id: userId } = req.user;

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
  }

  static async removePostLike(req, res) {
    const { postId } = req.params;
    const { id: userId } = req.user;

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
  }

  static async createComment(req, res) {
    const { postId } = req.params;
    const commentData = {
      ...req.body,
      postId,
      userId: req.user.id,
    };

    if (!postId || !commentData.userId || !commentData.text) {
      return res.status(400).json({
        success: false,
        msg: "Missing postId, userId, or text in request",
      });
    }

    try {
      const result = await Post.createComment(commentData);
      res.json(result);
    } catch (error) {
      console.error("Error creating comment:", error);
      res
        .status(500)
        .json({ success: false, msg: error.message || "Something went wrong" });
    }
  }
}

module.exports = PostController;
