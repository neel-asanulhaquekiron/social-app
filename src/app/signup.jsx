import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/helpers/validator";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const SignUp = () => {
  const router = useRouter();
  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validate = () => {
    const nameError = validateName(nameRef.current);
    const emailError = validateEmail(emailRef.current);
    const passwordError = validatePassword(passwordRef.current);
    const confirmPasswordError = validateConfirmPassword(
      passwordRef.current,
      confirmPasswordRef.current,
    );

    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    return !nameError && !emailError && !passwordError && !confirmPasswordError;
  };

  const onSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // await signUpApi(nameRef.current, emailRef.current, passwordRef.current);
      // navigate on success
    } catch (error) {
      Alert.alert("Sign Up Failed", error?.message || "Something went wrong");
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
          <Text style={styles.title}>Let's, </Text>
          <Text style={styles.title}>Get Started</Text>
        </View>
        <Text style={styles.subtitle}>
          Please fill the details to create an account
        </Text>

        <View style={styles.form}>
          <View>
            <Input
              placeholder="Enter your name"
              inputRef={nameRef}
              onChangeText={(value) => (nameRef.current = value)}
            />
            {errors.name ? (
              <Text style={styles.error}>{errors.name}</Text>
            ) : null}
          </View>

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
            {errors.password ? (
              <Text style={styles.error}>{errors.password}</Text>
            ) : null}
          </View>

          <View>
            <Input
              placeholder="Confirm your password"
              inputRef={confirmPasswordRef}
              secureTextEntry
              onChangeText={(value) => (confirmPasswordRef.current = value)}
            />
            {errors.confirmPassword ? (
              <Text style={styles.error}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          <Button title="Sign Up" loading={loading} onPress={onSubmit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.push("login")}>
            <Text
              style={[
                styles.footerText,
                {
                  color: theme.colors.primaryDark,
                  fontWeight: theme.fonts.semibold,
                },
              ]}
            >
              Login
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SignUp;

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
