import { channelStatusLogger, supabase } from "@/lib/supabase";
import { api } from "./apiClient";

export const createOrUpdatePost = (postData) => api.post("/posts", postData);

export const fetchPosts = ({ limit = 10, cursor = null, userName = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);
  if (userName) params.append("username", userName);

  return api.get(`/posts/?${params.toString()}`);
};

export const fetchPostById = (postId) => api.get(`/posts/${postId}`);

export const fetchComments = (postId, { limit = 20, cursor = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);

  return api.get(`/posts/${postId}/comments?${params.toString()}`);
};

export const createPostLike = (postId) => api.post(`/posts/${postId}/like`);

export const removePostLike = (postId) => api.delete(`/posts/${postId}/like`);

export const createComment = (comment) =>
  api.post(`/posts/${comment.postId}/comment`, comment);

export const deleteComment = (postId, commentId) =>
  api.delete(`/posts/${postId}/comment/${commentId}`);

// --- realtime -------------------------------------------------------------
// Channels no longer patch component state by hand (which meant fetching a
// user per event and rebuilding rows the server had already shaped). They
// report *that* something changed; the screen invalidates the relevant query
// and react-query refetches once.

const replaceChannel = (topic) => {
  const existing = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:${topic}`);

  if (existing) {
    supabase.removeChannel(existing);
  }
};

const changeChannel = (topic, config, onChange) => {
  replaceChannel(topic);

  return supabase
    .channel(topic)
    .on("postgres_changes", { event: "*", schema: "public", ...config }, (payload) =>
      onChange(payload),
    )
    .subscribe(channelStatusLogger(topic));
};

export const subscribeToPosts = (onChange) =>
  changeChannel("posts", { table: "posts" }, onChange);

export const subscribeToComments = (postId, onChange) =>
  changeChannel(
    `comments:${postId}`,
    { table: "comments", filter: `postId=eq.${postId}` },
    onChange,
  );

export const subscribeToAllComments = (onChange) =>
  changeChannel("comments", { table: "comments" }, onChange);

// Scoped to one post: a feed-wide like channel would fire constantly.
export const subscribeToPostLikes = (postId, onChange) =>
  changeChannel(
    `postLikes:${postId}`,
    { table: "postLikes", filter: `postId=eq.${postId}` },
    onChange,
  );

