const supabase = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");
const { applyKeyset, ordered, toPage } = require("../utils/cursor");

// Scalar counts instead of embedded arrays: a post with 5k likes used to ship
// 5k rows to render one number.
const POST_COLUMNS =
  "*, user: users!inner (id, name), likeCount: postLikes(count), commentCount: comments(count)";

const COMMENT_COLUMNS = "*, user: users (id, name)";

const firstCount = (value) => value?.[0]?.count ?? 0;

/** Collapses the aggregate embeds and adds `likedByMe` for the viewer. */
const shapePost = (row, likedPostIds) => {
  const { likeCount, commentCount, ...post } = row;

  return {
    ...post,
    likeCount: firstCount(likeCount),
    commentCount: firstCount(commentCount),
    likedByMe: likedPostIds.has(post.id),
  };
};

/**
 * Which of these posts has the viewer liked? One bounded query for the whole
 * page, instead of embedding every like row in every post.
 */
const fetchLikedPostIds = async (postIds, viewerId) => {
  if (!viewerId || postIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("postLikes")
    .select("postId")
    .eq("userId", viewerId)
    .in("postId", postIds);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.postId));
};

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

  static async fetchPosts({
    limit = 10,
    cursor = null,
    userName = null,
    viewerId = null,
  } = {}) {
    try {
      // One extra row tells us whether another page exists.
      let query = ordered(supabase.from("posts").select(POST_COLUMNS)).limit(
        limit + 1,
      );

      if (userName) {
        query = query.ilike("user.name", `%${userName}%`);
      }

      query = applyKeyset(query, cursor);

      const { data, error } = await query;

      if (error) {
        return dbError("fetching posts", error);
      }

      const { items, nextCursor } = toPage(data ?? [], limit);
      const likedPostIds = await fetchLikedPostIds(
        items.map((post) => post.id),
        viewerId,
      );

      return ok({
        data: items.map((row) => shapePost(row, likedPostIds)),
        nextCursor,
      });
    } catch (error) {
      return dbError("fetching posts", error);
    }
  }

  static async fetchPostById(postId, viewerId = null) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        return dbError("fetching post by ID", error);
      }

      if (!data) {
        return fail("Post not found", "not_found");
      }

      // Comments are no longer embedded — they have their own paginated
      // endpoint, so opening a post with 10k comments stays cheap.
      const likedPostIds = await fetchLikedPostIds([data.id], viewerId);

      return ok({ data: shapePost(data, likedPostIds) });
    } catch (error) {
      return dbError("fetching post by ID", error);
    }
  }

  static async fetchComments(postId, { limit = 20, cursor = null } = {}) {
    try {
      const query = applyKeyset(
        ordered(
          supabase.from("comments").select(COMMENT_COLUMNS).eq("postId", postId),
        ).limit(limit + 1),
        cursor,
      );

      const { data, error } = await query;

      if (error) {
        return dbError("fetching comments", error);
      }

      const { items, nextCursor } = toPage(data ?? [], limit);
      return ok({ data: items, nextCursor });
    } catch (error) {
      return dbError("fetching comments", error);
    }
  }

  static async createPostLike(postLike) {
    try {
      // UNIQUE (postId, userId) makes this idempotent: a double-tap or a
      // retried request never creates a second like.
      const { data, error } = await supabase
        .from("postLikes")
        .upsert(postLike, { onConflict: "postId,userId", ignoreDuplicates: true })
        .select()
        .maybeSingle();

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
        .select(COMMENT_COLUMNS)
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
