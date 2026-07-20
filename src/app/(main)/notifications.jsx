import Header from "@/components/Header";
import Loading from "@/components/Loading";
import NotificationItem from "@/components/NotificationItem";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { fetchNotifications } from "@/services/notificationServices";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const getNotifications = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      const { success, data, error } = await fetchNotifications(user?.id);
      if (success) {
        setNotifications(data);
      } else {
        console.error("Error fetching notifications:", error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
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
                setNotifications={setNotifications}
              />
            );
          })}
          {isLoading && <Loading />}
          {notifications.length === 0 && !isLoading && (
            <Text style={styles.noNotificationsText}>
              No notifications found.
            </Text>
          )}
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
  noNotificationsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
