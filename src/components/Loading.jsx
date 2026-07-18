import { theme } from "@/constants/theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const Loading = ({ size = "large", color = theme.colors.primary }) => {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({});
