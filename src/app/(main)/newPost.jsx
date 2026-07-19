import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createOrUpdatePost } from "../../../services/postService";

const NewPost = () => {
  const { user } = useAuth();
  const router = useRouter();
  const bodyRef = useRef("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const body = bodyRef.current.trim();

    if (!body) {
      Alert.alert("Post", "Please write something or add an image");
      return;
    }

    const data = {
      body,
      userId: user?.id,
    };

    setLoading(true);
    const res = await createOrUpdatePost(data);
    console.log("🚀 ~ onSubmit ~ res:", res);
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Post", res.msg || "Something went wrong");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Create Post" mb={15} />

        <ScrollView
          contentContainerStyle={{ gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* user info */}
          <View style={styles.userInfo}>
            <Avatar size={hp(6)} color={theme.colors.text} />
            <View>
              <Text style={styles.username}>{user?.name}</Text>
              <Text style={styles.publicText}>Public</Text>
            </View>
          </View>

          {/* text input */}
          <View style={styles.textEditor}>
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textLight}
              multiline
              style={styles.textInput}
              onChangeText={(value) => (bodyRef.current = value)}
            />
          </View>
        </ScrollView>

        <Button
          buttonStyle={styles.button}
          title="Post"
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NewPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  username: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  publicText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  textEditor: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius?.sm ?? 8,
    padding: 10,
    maxHeight: hp(40), // Limit editor height
  },

  textInput: {
    fontSize: hp(2),
    color: theme.colors.text,
    textAlignVertical: "top",
    minHeight: hp(15),
    maxHeight: hp(38),
  },
  button: {
    height: hp(6.2),
  },
});
