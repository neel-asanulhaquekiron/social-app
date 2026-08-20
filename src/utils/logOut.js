import { logout } from "@/services/authService";
import { Alert } from "react-native";

// No navigation here: ending the Supabase session flips the route guard in
// the root layout, which drops the authed screens and lands on /welcome.
const performLogout = async () => {
  await logout();
};

export const handleLogOut = () => {
  Alert.alert("Confirm", "Are you sure you want to log out?", [
    {
      text: "Cancel",
      onPress: () => {},
      style: "cancel",
    },
    {
      text: "Logout",
      onPress: () => performLogout(),
      style: "destructive",
    },
  ]);
};
