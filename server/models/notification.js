const supabase = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");

class Notification {
  static async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        return dbError("creating notification", error);
      }

      return ok({ data });
    } catch (error) {
      return dbError("creating notification", error);
    }
  }

  static async markNotificationAsClicked(notificationId, receiverId) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ isClicked: true })
        .eq("id", notificationId)
        .eq("receiverId", receiverId)
        .select()
        .maybeSingle();

      if (error) {
        return dbError("marking notification as clicked", error);
      }

      if (!data) {
        return fail("Notification not found", "not_found");
      }

      return ok({ data });
    } catch (error) {
      return dbError("marking notification as clicked", error);
    }
  }

  static async getUnseenNotificationCount(receiverId) {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("receiverId", receiverId)
        .not("isSeen", "is", true);

      if (error) {
        return dbError("fetching unseen notification count", error);
      }

      return ok({ count });
    } catch (error) {
      return dbError("fetching unseen notification count", error);
    }
  }

  static async fetchNotifications(receiverId) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, sender: senderId (id, name)")
        .eq("receiverId", receiverId)
        .order("created_at", { ascending: false });

      if (error) {
        return dbError("fetching notifications", error);
      }

      // Fire-and-forget: mark unseen notifications as seen, don't block the response on it
      supabase
        .from("notifications")
        .update({ isSeen: true })
        .eq("receiverId", receiverId)
        .not("isSeen", "is", true)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error("Error marking notifications as seen:", updateError);
          }
        });

      return ok({ data });
    } catch (error) {
      return dbError("fetching notifications", error);
    }
  }
}

module.exports = Notification;
