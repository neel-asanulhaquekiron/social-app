import { hp } from "@/helpers/common";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Pressable, Text, View } from "react-native";
import Loading from "./Loading";

const Button = ({
  buttonStyle,
  textStyle,
  title = "Button",
  onPress = () => {},
  loading = false,
  hasShadow = true,
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };

  if (loading) {
    return (
      <View
        style={[
          styles.button,
          buttonStyle,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Loading />
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.button, buttonStyle, hasShadow && shadowStyle]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

export default Button;

const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: theme.colors.primary,
    minHeight: hp(6.6),
    justifyContent: "center",
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: theme.radius.xl,
  },
  text: {
    fontSize: hp(2.5),
    color: theme.colors.onPrimary,
    fontWeight: theme.fonts.bold,
  },
}));
