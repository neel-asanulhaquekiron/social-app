const { supabase } = require("../config/db.js");
const logger = require("../config/logger");
const { sendPushNotifications } = require("./pushService");

// Titles are what the app renders next to the sender's name
// ("<name> liked your post"), so keep them short and lower-case.
const TEMPLATES = {
  like: {
    title: "liked your post",
    pushTitle: "New like",
    data: ({ postId }) => ({ postId }),
  },
  comment: {
    title: "commented on your post",
    pushTitle: "New comment",
    data: ({ postId, commentId }) => ({ postId, commentId }),
  },
};

/**
 * Create the in-app notification row for a post's owner and send them a push.
 * Runs entirely server-side, off the request path (see `enqueue`). Never
 * throws — failures are logged.
 *
 * @param {{ type: "like"|"comment", postId: number, actorId: string, commentId?: number }} params
 */
const notifyPostOwner = async ({ type, postId, actorId, commentId }) => {
  const template = TEMPLATES[type];
  if (!template) return;

  try {
    const [{ data: post, error: postError }, { data: actor, error: actorError }] =
      await Promise.all([
        supabase
          .from("posts")
          .select("userId, owner:users!posts_userId_fkey(id, name, pushToken)")
          .eq("id", postId)
          .maybeSingle(),
        supabase.from("users").select("id, name").eq("id", actorId).maybeSingle(),
      ]);

    if (postError || actorError) {
      logger.error({ err: postError || actorError }, "notifyPostOwner lookup failed");
      return;
    }
    if (!post?.owner || !actor) return;
    if (post.owner.id === actorId) return; // no self-notifications

    const data = template.data({ postId, commentId });

    // A like can be toggled repeatedly; only notify the first time.
    if (type === "like") {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("senderId", actorId)
        .eq("receiverId", post.owner.id)
        .eq("title", template.title)
        .eq("data->>postId", String(postId));
      if (count > 0) return;
    }

    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        senderId: actorId,
        receiverId: post.owner.id,
        title: template.title,
        data, // jsonb
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error({ err: insertError }, "failed to insert notification");
      return;
    }

    if (post.owner.pushToken) {
      await sendPushNotifications([
        {
          to: post.owner.pushToken,
          title: template.pushTitle,
          body: `${actor.name || "Someone"} ${template.title}`,
          data: { ...data, notificationId: notification.id, type },
        },
      ]);
    }
  } catch (error) {
    logger.error({ err: error, type, postId }, "notifyPostOwner failed");
  }
};

/** Fire-and-forget: run after the current request has been answered. */
const enqueue = (task) => {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => logger.error({ err: error }, "background task failed"));
  });
};

module.exports = { notifyPostOwner, enqueue };
