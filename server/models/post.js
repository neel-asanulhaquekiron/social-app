const supabase = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");

class Post {
  static async createOrUpdatePost(postData) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .upsert(postData)
        .select()
        .single();

      if (error) {
        return dbError("creating/updating post", error);
      }

      return ok({ data });
    } catch (error) {
      return dbError("creating/updating post", error);
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
        return dbError("fetching posts", error);
      }

      return ok({ data });
    } catch (error) {
      return dbError("fetching posts", error);
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
        .order("created_at", { ascending: false, referencedTable: "comments" })
        .maybeSingle();

      if (error) {
        return dbError("fetching post by ID", error);
      }

      if (!data) {
        return fail("Post not found", "not_found");
      }

      return ok({ data });
    } catch (error) {
      return dbError("fetching post by ID", error);
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
        return dbError("creating post like", error);
      }

      return ok({ data });
    } catch (error) {
      return dbError("creating post like", error);
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
        return dbError("removing post like", error);
      }

      return ok();
    } catch (error) {
      return dbError("removing post like", error);
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
        return dbError("creating comment", error);
      }

      return ok({ data });
    } catch (error) {
      return dbError("creating comment", error);
    }
  }

  // Only the comment author or the post owner may delete a comment.
  static async deleteComment(commentId, postId, requesterId) {
    try {
      const { data: comment, error: fetchError } = await supabase
        .from("comments")
        .select("id, userId, post:posts!inner(userId)")
        .eq("id", commentId)
        .eq("postId", postId)
        .maybeSingle();

      if (fetchError) {
        return dbError("fetching comment", fetchError);
      }

      if (!comment) {
        return fail("Comment not found", "not_found");
      }

      const isAuthor = comment.userId === requesterId;
      const isPostOwner = comment.post?.userId === requesterId;
      if (!isAuthor && !isPostOwner) {
        return fail("Not allowed to delete this comment", "forbidden");
      }

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("postId", postId);

      if (error) {
        return dbError("deleting comment", error);
      }

      return ok();
    } catch (error) {
      return dbError("deleting comment", error);
    }
  }
}

module.exports = Post;
