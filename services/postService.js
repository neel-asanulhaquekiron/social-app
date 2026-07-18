import { supabase } from "@/lib/supabase";

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
