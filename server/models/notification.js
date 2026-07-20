const supabase = require("../config/db.js");

class Notification {
  static async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return { success: false, msg: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error creating notification:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async markNotificationAsClicked(notificationId) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ isClicked: true })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) {
        console.error("Error marking notification as clicked:", error);
        return { success: false, msg: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error marking notification as clicked:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async getUnseenNotificationCount(receiverId) {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("receiverId", receiverId)
        .not("isSeen", "is", true);

      if (error) {
        console.error("Error fetching unseen notification count:", error);
        return { success: false, msg: error.message };
      }

      return { success: true, count };
    } catch (error) {
      console.error("Error fetching unseen notification count:", error);
      return { success: false, msg: error.message || "Something went wrong" };
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
        console.error("Error fetching notifications:", error);
        return { success: false, msg: error.message };
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

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }
}

module.exports = Notification;
