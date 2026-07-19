const supabase = require("../config/db.js");

class Post {
  static async createOrUpdatePost(postData) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .upsert(postData)
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
  }

  static async fetchPosts(limit = 10) {
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
  }

  static async fetchPostById(postId) {
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
  }
}

module.exports = Post;
