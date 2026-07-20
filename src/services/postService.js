import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";
import { getUserData } from "./userService";

export const createOrUpdatePost = async (postData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error creating/updating post via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchPosts = async (limit = 10, userName = null) => {
  try {
    const params = new URLSearchParams({ limit });
    if (userName) {
      params.append("username", userName);
    }
    const res = await fetch(`${API_BASE_URL}/posts/?${params.toString()}`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchPostById = async (postId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error fetching post by ID via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const createPostLike = async (postLikeData) => {
  try {
    const { userId, postId } = postLikeData;
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error creating post like via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const removePostLike = async (postId, userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error removing post like via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const createComment = async (comment) => {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${comment.postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comment),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error creating comment via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const deleteComment = async (commentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/comment/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error deleting comment via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

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
    .subscribe();

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
    .subscribe();

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
    .subscribe();

  return channel;
};

export const unsubscribeFromChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
