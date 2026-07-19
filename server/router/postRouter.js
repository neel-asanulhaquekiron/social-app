const express = require("express");
const router = express.Router();
const Post = require("../models/post.js");

router.post("/createOrUpdate", async (req, res) => {
  const postData = req.body;
  const result = await Post.createOrUpdatePost(postData);
  res.json(result);
});

router.get("/fetchPosts", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const result = await Post.fetchPosts(limit);
  res.json(result);
});

router.get("/fetchPostById/:postId", async (req, res) => {
  const postId = req.params.postId;
  const result = await Post.fetchPostById(postId);
  res.json(result);
});

module.exports = router;
