import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ScreenWrapper = ({ children, bg, scrollable = true }) => {
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
        backgroundColor: bg,
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
