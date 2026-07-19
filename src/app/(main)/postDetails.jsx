import CommentItem from "@/components/CommentItem";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createNotification } from "../../../services/notificationServices";
import {
  createComment,
  deleteComment,
  fetchPostById,
  subscribeToComments,
  unsubscribeFromChannel,
} from "../../../services/postService";

const PostDetails = () => {
  const { postId, commentId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef("");
  const commentRef = useRef("");
  const [startLoading, setStartLoading] = useState(true);
  const [postDetails, setPostDetails] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);

  const getPostDetails = async () => {
    try {
      const { error, data } = await fetchPostById(postId);
      if (error) {
        console.error("Error fetching post details:", error);
        return;
      }
      setPostDetails(data);
      setStartLoading(false);
    } catch (error) {
      console.error("Error fetching post details:", error);
    }
  };

  const onNewComment = async () => {
    if (!commentRef.current) {
      return;
    }
    const text = commentRef.current.trim();

    if (!text) {
      return;
    }

    const data = {
      postId: postDetails?.id,
      userId: user?.id,
      text,
    };

    setSendingComment(true);
    const { success, data: newComment, msg } = await createComment(data);
    setSendingComment(false);

    if (success) {
      if (user?.id !== postDetails?.userId) {
        const notify = {
          senderId: user?.id,
          receiverId: postDetails?.userId,
          title: "commented on your post",
          data: JSON.stringify({
            postId: postDetails?.id,
            commentId: newComment?.id,
          }),
        };
        await createNotification(notify);
      }
      inputRef?.current?.clear();
      commentRef.current = "";
    } else {
      Alert.alert("Comment", msg || "Something went wrong");
    }
  };

  const onDeleteComment = async (comment) => {
    const { success, msg } = await deleteComment(comment?.id);
    if (success) {
      setPostDetails((prevDetails) => ({
        ...prevDetails,
        comments: prevDetails?.comments?.filter((c) => c?.id !== comment?.id),
      }));
    } else {
      Alert.alert("Comment", msg || "Something went wrong");
    }
  };

  useEffect(() => {
    const commentChannel = subscribeToComments(postId, setPostDetails);
    getPostDetails();
    return () => {
      unsubscribeFromChannel(commentChannel);
    };
  }, []);

  if (startLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    );
  }

  if (!postDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Post Details" showBackButton={true} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <PostCard
            item={{
              ...postDetails,
              comments: [{ count: postDetails?.comments?.length }],
            }}
            currentUser={user}
            router={router}
            hasShadow={false}
            disableDetailsNavigation={true}
          />

          {/* comment input */}
          <View style={styles.inputContainer}>
            <Input
              ref={inputRef}
              placeholder="Write a comment..."
              onChangeText={(value) => (commentRef.current = value)}
              containerStyle={styles.commentInput}
            />

            {sendingComment ? (
              <View style={styles.sendIcon}>
                <Loading size="small" />
              </View>
            ) : (
              <Pressable style={styles.sendIcon} onPress={onNewComment}>
                <Ionicons
                  name="send"
                  size={hp(2.4)}
                  color={theme.colors.primaryDark ?? theme.colors.text}
                />
              </Pressable>
            )}
          </View>

          {/* comment list */}
          <View style={{ gap: 20, marginVertical: 15 }}>
            {postDetails?.comments?.length > 0 &&
              postDetails?.comments?.map((comment) => (
                <CommentItem
                  item={comment}
                  key={comment?.id?.toString()}
                  //   canDelete={
                  //     comment?.userId === user?.id ||
                  //     postDetails?.userId === user?.id
                  //   }
                  //   onDelete={onDeleteComment}
                  highlight={comment?.id == commentId}
                />
              ))}

            {postDetails?.comments?.length === 0 && (
              <Text
                style={{ textAlign: "center", color: theme.colors.textLight }}
              >
                Be the first to comment on this post!
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    height: hp(6.2),
  },
  sendIcon: {
    height: hp(5.8),
    width: hp(5.8),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.radius?.lg ?? 16,
    borderWidth: 1,
    borderColor: theme.colors?.gray ?? "#e0e0e0",
  },
});
