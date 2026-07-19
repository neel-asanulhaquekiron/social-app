import { logout } from "@/services/authService";
import { Alert } from "react-native";

const performLogout = async ({ setAuth, router }) => {
  await logout();
  setAuth(null);
  router.replace("/welcome");
};

export const handleLogOut = ({ setAuth, router }) => {
  Alert.alert("Confirm", "Are you sure you want to log out?", [
    {
      text: "Cancel",
      onPress: () => {},
      style: "cancel",
    },
    {
      text: "Logout",
      onPress: () => performLogout({ setAuth, router }),
      style: "destructive",
    },
  ]);
};
