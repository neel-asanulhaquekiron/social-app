const supabase = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");

class Notification {
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
        .eq("isSeen", false);

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

      return ok({ data });
    } catch (error) {
      return dbError("fetching notifications", error);
    }
  }

  // Marks every unseen notification of the receiver as seen (idempotent).
  static async markAllSeen(receiverId) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ isSeen: true })
        .eq("receiverId", receiverId)
        .eq("isSeen", false)
        .select("id");

      if (error) {
        return dbError("marking notifications as seen", error);
      }

      return ok({ updated: data?.length ?? 0 });
    } catch (error) {
      return dbError("marking notifications as seen", error);
    }
  }
}

module.exports = Notification;
