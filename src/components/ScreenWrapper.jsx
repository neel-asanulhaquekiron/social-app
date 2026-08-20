import { useTheme } from "@/hooks/useTheme";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// `bg` defaults to the themed background so a screen that forgets to pass it
// cannot end up transparent over a light surface.
const ScreenWrapper = ({ children, bg, scrollable = true }) => {
  const theme = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const paddingTop = top > 0 ? top + 5 : 30;

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: bg ?? theme.colors.background,
        paddingTop,
        paddingBottom: bottom,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  );
};

export default ScreenWrapper;
