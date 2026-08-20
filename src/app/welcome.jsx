import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import { hp, wp } from "@/helpers/common";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";

const Welcome = () => {
  const styles = useStyles();
  const theme = useTheme();
  const router = useRouter();
  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        {/* title */}
        <View style={{ gap: 20 }}>
          <Text style={styles.title}>Welcome to the App</Text>
          <Text style={styles.punchline}>Your journey starts here!</Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
            title="Sign Up"
            buttonStyle={{
              marginHorizontal: wp(3),
            }}
            onPress={() => {
              router.push("/signup");
            }}
          />
          <View style={styles.bottomTextContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Pressable
              onPress={() => {
                router.push("/login");
              }}
            >
              <Text
                style={[
                  styles.loginText,
                  { color: theme.colors.primary, fontWeight: theme.fonts.bold },
                ]}
              >
                Log In
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: wp(4),
    gap: 50,
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(4),
    textAlign: "center",
    fontWeight: theme.fonts.extraBold,
  },
  punchline: {
    color: theme.colors.text,
    fontSize: hp(1.7),
    textAlign: "center",
    paddingHorizontal: wp(10),
  },
  footer: {
    gap: 30,
    width: "100%",
  },
  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  loginText: {
    textAlign: "center",
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
}));
