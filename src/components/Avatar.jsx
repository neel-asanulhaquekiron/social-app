import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

const Avatar = ({ size = 24, color = theme.colors.textLight }) => {
  return (
    <View>
      <Ionicons name="person-circle-outline" size={size} color={color} />
    </View>
  );
};

export default Avatar;
