import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import { validateEmail } from "@/helpers/validator";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const Login = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const validate = () => {
    const emailError = validateEmail(emailRef.current);
    setErrors({ email: emailError });

    return !emailError;
  };

  const onSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // await loginApi(emailRef.current, passwordRef.current);
      // navigate on success
    } catch (error) {
      Alert.alert("Login Failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* welcome */}
        <View>
          <Text style={styles.title}>Hey, </Text>
          <Text style={styles.title}>Welcome back</Text>
        </View>
        <Text style={styles.subtitle}>Please login to continue</Text>

        <View style={styles.form}>
          <View>
            <Input
              placeholder="Enter your email"
              inputRef={emailRef}
              keyboardType="email-address"
              onChangeText={(value) => (emailRef.current = value)}
            />
            {errors.email ? (
              <Text style={styles.error}>{errors.email}</Text>
            ) : null}
          </View>

          <View>
            <Input
              placeholder="Enter your password"
              inputRef={passwordRef}
              secureTextEntry
              onChangeText={(value) => (passwordRef.current = value)}
            />
          </View>

          <Button title="Login" loading={loading} onPress={onSubmit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push("signup")}>
            <Text
              style={[
                styles.footerText,
                {
                  color: theme.colors.primaryDark,
                  fontWeight: theme.fonts.semibold,
                },
              ]}
            >
              Sign up
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(5),
    gap: 25,
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  form: {
    gap: 18,
  },
  error: {
    color: "red",
    fontSize: hp(2),
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    textAlign: "center",
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
});
