import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

const Input = (props) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = props.secureTextEntry !== undefined;

  return (
    <View
      style={[styles.container, props.containerStyle && props.containerStyle]}
    >
      {props.icon && props.icon}
      <TextInput
        ref={props.ref && props.ref}
        style={styles.input}
        placeholderTextColor={theme.colors.textLight}
        {...props}
        secureTextEntry={isPasswordField ? !isPasswordVisible : false}
      />
      {isPasswordField && (
        <Pressable onPress={() => setIsPasswordVisible((prev) => !prev)}>
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
  },
});
