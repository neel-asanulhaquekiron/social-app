const PushNotificationService = require("../utils/pushNotifications.js");
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

  static async fetchPosts(limit = 10, userName = null) {
    try {
      let query = supabase
        .from("posts")
        .select(
          "*, user: users!inner (id, name), postLikes (*), comments (count)",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (userName) {
        query = query.ilike("user.name", `%${userName}%`);
      }

      const { data, error } = await query;

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

  static async createPostLike(postLike) {
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

      const { data: post } = await supabase
        .from("posts")
        .select("userId")
        .eq("id", postLike.postId)
        .single();

      if (post && post.userId !== postLike.userId) {
        const { data: owner } = await supabase
          .from("users")
          .select("pushToken, name")
          .eq("id", post.userId)
          .single();

        if (owner?.pushToken) {
          await PushNotificationService.sendPushNotification(
            owner.pushToken,
            "New Like",
            "Someone liked your post",
            { postId: postLike.postId },
          );
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error creating post like:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async removePostLike(postId, userId) {
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
  }

  static async createComment(comment) {
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

      const { data: post } = await supabase
        .from("posts")
        .select("userId")
        .eq("id", comment.postId)
        .single();

      if (post && post.userId !== comment.userId) {
        const { data: owner } = await supabase
          .from("users")
          .select("pushToken, name")
          .eq("id", post.userId)
          .single();

        if (owner?.pushToken) {
          await PushNotificationService.sendPushNotification(
            owner.pushToken,
            "New Comment",
            "Someone commented on your post",
            { postId: comment.postId },
          );
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error creating comment:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async deleteComment(commentId) {
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
  }
}

module.exports = Post;
