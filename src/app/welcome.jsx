import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

const Welcome = () => {
  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* title */}
        <View style={{ gap: 20 }}>
          <Text style={styles.title}>Welcome to the App</Text>
          <Text style={styles.punchline}>Your journey starts here!</Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
            title="Get Started"
            buttonStyle={{
              marginHorizontal: wp(3),
            }}
            onPress={() => {
              // Handle button press
            }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: wp(4),
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
});
