import { supabase } from "@/lib/supabase";

export const createOrUpdatePost = async (post) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .upsert(post)
      .select()
      .single();

    if (error) {
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating/updating post:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};
