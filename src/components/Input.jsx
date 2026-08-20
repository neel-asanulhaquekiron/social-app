import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

// Props are destructured rather than spread wholesale: the old version passed
// `containerStyle`, `icon` and `ref` straight through to TextInput, and set
// `ref={props.ref && props.ref}` — which is just `props.ref`, and was then
// overwritten by the `{...props}` spread that followed it anyway.
const Input = ({
  ref,
  icon,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {icon}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.textLight}
        {...props}
        secureTextEntry={isPasswordField ? !isPasswordVisible : false}
      />
      {isPasswordField && (
        <Pressable
          onPress={() => setIsPasswordVisible((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={
            isPasswordVisible ? "Hide password" : "Show password"
          }
          hitSlop={8}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="gray"
          />
        </Pressable>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: hp(7.2),
    borderWidth: 1,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: "continuous",
    paddingHorizontal: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
});
