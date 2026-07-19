import { supabase } from "@/lib/supabase";
import { getUserData } from "./userService";

export const createOrUpdatePost = async (post) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .upsert(post)
      .select()
      .single();

    if (error) {
      console.error("Error creating/updating post:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating/updating post:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchPosts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, user: users (id, name), postLikes (*), comments (count)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching posts:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchPostById = async (postId) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "*, user: users (id, name), postLikes (*), comments (* , user: users(id, name))",
      )
      .eq("id", postId)
      .order("created_at", { ascending: false, foreignTable: "comments" })
      .single();

    if (error) {
      console.error("Error fetching post by ID:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const createPostLike = async (postLike) => {
  try {
    const { data, error } = await supabase
      .from("postLikes")
      .insert(postLike)
      .select()
      .single();

    if (error) {
      console.error("Error creating post like:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating post like:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const removePostLike = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from("postLikes")
      .delete()
      .eq("postId", postId)
      .eq("userId", userId);

    if (error) {
      console.error("Error removing post like:", error);
      return { success: false, msg: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing post like:", error);
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

export const createComment = async (comment) => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return { success: false, msg: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
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

export const unsubscribeFromChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
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
      { event: "*", schema: "public", table: "comments" },
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

        if (!postId) return;

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id !== postId) return post;

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
