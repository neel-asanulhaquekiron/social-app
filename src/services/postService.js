import { channelStatusLogger, supabase } from "@/lib/supabase";
import { api } from "./apiClient";
import { getUserData } from "./userService";

export const createOrUpdatePost = (postData) => api.post("/posts", postData);

export const fetchPosts = (limit = 10, userName = null) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (userName) {
    params.append("username", userName);
  }
  return api.get(`/posts/?${params.toString()}`);
};

export const fetchPostById = (postId) => api.get(`/posts/${postId}`);

export const createPostLike = (postId) => api.post(`/posts/${postId}/like`);

export const removePostLike = (postId) => api.delete(`/posts/${postId}/like`);

export const createComment = (comment) =>
  api.post(`/posts/${comment.postId}/comment`, comment);

export const deleteComment = (postId, commentId) =>
  api.delete(`/posts/${postId}/comment/${commentId}`);

const getPostsChannelHandler = (setPosts) => {
  return async (payload) => {
    if (payload.eventType === "INSERT" && payload?.new?.id) {
      const newPost = { ...payload.new };
      const res = await getUserData(newPost.userId);
      newPost.user = res.success ? res.data : {};
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }
  };
};

export const subscribeToPosts = (setPosts) => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === "realtime:posts");
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel("posts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
      getPostsChannelHandler(setPosts),
    )
    .subscribe(channelStatusLogger("posts"));

  return channel;
};

export const subscribeToComments = (postId, setPostDetails) => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:comments:${postId}`);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(`comments:${postId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `postId=eq.${postId}`,
      },
      async (payload) => {
        if (payload.eventType === "INSERT" && payload?.new?.id) {
          const newComment = { ...payload.new };
          const res = await getUserData(newComment.userId);
          newComment.user = res.success ? res.data : {};
          setPostDetails((prevDetails) => ({
            ...prevDetails,
            comments: [newComment, ...(prevDetails?.comments || [])],
          }));
        }
      },
    )
    .subscribe(channelStatusLogger(`comments:${postId}`));

  return channel;
};

export const subscribeToAllComments = (setPosts) => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === "realtime:comments");
  if (existingChannel) {
    unsubscribeFromChannel(existingChannel);
  }

  const channel = supabase
    .channel("comments")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      (payload) => {
        const postId = payload?.new?.postId ?? payload?.old?.postId;

        if (!postId) {
          return;
        }

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            const currentCount = post?.comments?.[0]?.count ?? 0;
            const delta =
              payload.eventType === "INSERT"
                ? 1
                : payload.eventType === "DELETE"
                  ? -1
                  : 0;

            return {
              ...post,
              comments: [{ count: Math.max(currentCount + delta, 0) }],
            };
          }),
        );
      },
    )
    .subscribe(channelStatusLogger("comments"));

  return channel;
};

export const unsubscribeFromChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
