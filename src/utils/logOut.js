import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    Alert.alert("Logout Failed", error.message);
  }
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
      onPress: logOut,
      style: "destructive",
    },
  ]);
};
