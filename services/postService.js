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
      .select("*, user: users (id, name)")
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
  // Clean up any stale channel with the same name (handles StrictMode
  // double-invoke and Fast Refresh leaving a subscribed channel behind)
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

export const unsubscribeFromPosts = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
