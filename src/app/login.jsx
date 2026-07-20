import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { loginSchema } from "@/helpers/validationSchemas";
import { login } from "@/services/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const Login = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // const onSubmit = async ({ email, password }) => {
  //   setLoading(true);
  //   try {
  //     const { error } = await supabase.auth.signInWithPassword({
  //       email: email.trim(),
  //       password: password.trim(),
  //     });

  //     if (error) {
  //       Alert.alert("Login Failed", error.message);
  //     }
  //   } catch (error) {
  //     Alert.alert("Login Failed", error?.message || "Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    const result = await login({
      email: email.trim(),
      password: password.trim(),
    });
    setLoading(false);

    if (result.success) {
      setAuth(result.user);
      router.replace("/home");
    } else {
      Alert.alert("Login Failed", result.msg || "Something went wrong");
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
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>

          <View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Enter your password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password.message}</Text>
            )}
          </View>

          <Button
            title="Login"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          />
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
