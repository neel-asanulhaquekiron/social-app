import { supabase } from "@/lib/supabase";

export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

export const fetchNotifications = async (receiverId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, sender: senderId (id, name)")
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error };
  }
};
