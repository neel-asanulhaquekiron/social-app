const Post = require("../models/post.js");
const { sendResult } = require("../utils/result");
const { notifyPostOwner, enqueue } = require("../services/notificationService");

// All handlers are wrapped with asyncHandler in the router, so thrown errors
// reach the JSON error handler; models return { success, ... } objects that
// sendResult maps to status codes.
class PostController {
  static async createPost(req, res) {
    const result = await Post.createPost({
      ...req.body,
      userId: req.user.id,
    });
    sendResult(res, result, 201);
  }

  static async fetchPosts(req, res) {
    // Coerced values live on req.validated.query (req.query is read-only in Express 5).
    const {
      limit = 10,
      cursor = null,
      username = null,
    } = req.validated?.query ?? {};

    const result = await Post.fetchPosts({
      limit,
      cursor,
      userName: username,
      // These routes are public; `likedByMe` is simply false when signed out.
      viewerId: req.user?.id ?? null,
    });
    sendResult(res, result);
  }

  static async fetchPostById(req, res) {
    const result = await Post.fetchPostById(
      req.params.postId,
      req.user?.id ?? null,
    );
    sendResult(res, result);
  }

  static async fetchComments(req, res) {
    const { limit = 20, cursor = null } = req.validated?.query ?? {};
    const result = await Post.fetchComments(req.params.postId, { limit, cursor });
    sendResult(res, result);
  }

  static async createPostLike(req, res) {
    const { postId } = req.params;
    const result = await Post.createPostLike({ postId, userId: req.user.id });

    if (result.success) {
      // Off the request path: in-app notification row + push to the post owner.
      enqueue(() => notifyPostOwner({ type: "like", postId, actorId: req.user.id }));
    }
    sendResult(res, result, 201);
  }

  static async removePostLike(req, res) {
    const result = await Post.removePostLike(req.params.postId, req.user.id);
    sendResult(res, result);
  }

  static async createComment(req, res) {
    const { postId } = req.params;
    const result = await Post.createComment({
      text: req.body.text,
      postId,
      userId: req.user.id,
    });

    if (result.success) {
      enqueue(() =>
        notifyPostOwner({
          type: "comment",
          postId,
          actorId: req.user.id,
          commentId: result.data?.id,
        }),
      );
    }
    sendResult(res, result, 201);
  }

  static async deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const result = await Post.deleteComment(commentId, postId, req.user.id);
    sendResult(res, result);
  }
}

module.exports = PostController;
