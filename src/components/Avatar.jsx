import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

// The default colour is resolved from the active theme rather than captured
// at module load, so it follows the colour scheme.
const Avatar = ({ size = 24, color }) => {
  const theme = useTheme();

  return (
    <View>
      <Ionicons
        name="person-circle-outline"
        size={size}
        color={color ?? theme.colors.textLight}
      />
    </View>
  );
};

export default Avatar;
