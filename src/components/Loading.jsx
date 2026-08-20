import { useTheme } from "@/hooks/useTheme";
import { ActivityIndicator, View } from "react-native";

const Loading = ({ size = "large", color }) => {
  const theme = useTheme();

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size={size} color={color ?? theme.colors.primary} />
    </View>
  );
};

export default Loading;
