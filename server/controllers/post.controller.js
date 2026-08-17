const Post = require("../models/post.js");
const { sendResult } = require("../utils/result");

// All handlers are wrapped with asyncHandler in the router, so thrown errors
// reach the JSON error handler; models return { success, ... } objects that
// sendResult maps to status codes.
class PostController {
  static async createOrUpdatePost(req, res) {
    const result = await Post.createOrUpdatePost({
      ...req.body,
      userId: req.user.id,
    });
    sendResult(res, result, 201);
  }

  static async fetchPosts(req, res) {
    // Coerced values live on req.validated.query (req.query is read-only in Express 5).
    const { limit = 10, username = null } = req.validated?.query ?? {};
    const result = await Post.fetchPosts(limit, username);
    sendResult(res, result);
  }

  static async fetchPostById(req, res) {
    const result = await Post.fetchPostById(req.params.postId);
    sendResult(res, result);
  }

  static async createPostLike(req, res) {
    const result = await Post.createPostLike({
      postId: req.params.postId,
      userId: req.user.id,
    });
    sendResult(res, result, 201);
  }

  static async removePostLike(req, res) {
    const result = await Post.removePostLike(req.params.postId, req.user.id);
    sendResult(res, result);
  }

  static async createComment(req, res) {
    const result = await Post.createComment({
      text: req.body.text,
      postId: req.params.postId,
      userId: req.user.id,
    });
    sendResult(res, result, 201);
  }

  static async deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const result = await Post.deleteComment(commentId, postId, req.user.id);
    sendResult(res, result);
  }
}

module.exports = PostController;
