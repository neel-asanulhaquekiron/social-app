import Header from "@/components/Header";
import NotificationItem from "@/components/NotificationItem";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchNotifications } from "../../../services/notificationServices";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const router = useRouter();

  const getNotifications = async () => {
    try {
      const { success, data, error } = await fetchNotifications(user?.id);
      if (success) {
        setNotifications(data);
      } else {
        console.error("Error fetching notifications:", error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);
  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Notifications" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {notifications.map((notification) => {
            return (
              <NotificationItem
                item={notification}
                key={notification?.id}
                router={router}
              />
            );
          })}
          {notifications.length === 0 && <Text>No notifications yet.</Text>}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};
export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  scrollContainer: {
    paddingVertical: 20,
    gap: 5,
  },
});
