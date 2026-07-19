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

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }
}

module.exports = Notification;
