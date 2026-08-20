import CommentItem from "@/components/CommentItem";
import Header from "@/components/Header";
import Input from "@/components/Input";
import { ErrorState, ListState, LoadingState } from "@/components/ListStates";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp } from "@/helpers/common";
import { patchCommentCount } from "@/lib/postCache";
import { unsubscribeFromChannel } from "@/lib/supabase";
import { queryKeys, unwrap } from "@/lib/queryClient";
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchPostById,
  subscribeToComments,
  subscribeToPostLikes,
} from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COMMENTS_PAGE_SIZE = 20;

const PostDetails = () => {
  const { postId, commentId } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const commentRef = useRef("");

  const {
    data: postDetails,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: async () => unwrap(await fetchPostById(postId)).data,
    enabled: !!postId,
  });

  // Comments live behind their own cursor-paginated endpoint now, so opening
  // a post with thousands of comments no longer ships them all at once.
  const {
    data: commentPages,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsErrorValue,
    refetch: refetchComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: async ({ pageParam }) => {
      const result = unwrap(
        await fetchComments(postId, {
          limit: COMMENTS_PAGE_SIZE,
          cursor: pageParam,
        }),
      );
      return { data: result.data ?? [], nextCursor: result.nextCursor ?? null };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!postId,
  });

  const comments = commentPages?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    if (!postId) return undefined;

    const commentChannel = subscribeToComments(postId, () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) }),
    );
    const likeChannel = subscribeToPostLikes(postId, () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) }),
    );

    return () => {
      unsubscribeFromChannel(commentChannel);
      unsubscribeFromChannel(likeChannel);
    };
  }, [postId, queryClient]);

  const { mutate: submitComment, isPending: sendingComment } = useMutation({
    mutationFn: (text) => createComment({ postId: Number(postId), text }),
    onSuccess: (result) => {
      if (!result.success) {
        Alert.alert("Comment", result.msg || "Something went wrong");
        return;
      }

      // The server creates the owner's notification + push after a comment.
      inputRef?.current?.clear();
      commentRef.current = "";
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      patchCommentCount(queryClient, postId, 1);
    },
    onError: (mutationError) =>
      Alert.alert("Comment", mutationError.message || "Something went wrong"),
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: (comment) => deleteComment(postId, comment?.id),
    onSuccess: (result) => {
      if (!result.success) {
        Alert.alert("Comment", result.msg || "Something went wrong");
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      patchCommentCount(queryClient, postId, -1);
    },
    onError: (mutationError) =>
      Alert.alert("Comment", mutationError.message || "Something went wrong"),
  });

  const onNewComment = () => {
    const text = commentRef.current?.trim();
    if (!text) {
      return;
    }
    submitComment(text);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState />
      </View>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Post Details" showBackButton={true} />

        {isError && (
          <View style={styles.loadingContainer}>
            <ErrorState
              message={error?.message || "Could not load this post"}
              onRetry={refetch}
            />
          </View>
        )}

        {!isError && !postDetails && (
          <View style={styles.loadingContainer}>
            <Text style={styles.mutedText}>Post not found</Text>
          </View>
        )}

        {postDetails && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            <PostCard
              item={postDetails}
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
            <View style={styles.commentList}>
              {comments.map((comment) => (
                <CommentItem
                  item={comment}
                  key={comment?.id?.toString()}
                  canDelete={
                    comment?.userId === user?.id ||
                    postDetails?.userId === user?.id
                  }
                  onDelete={removeComment}
                  highlight={String(comment?.id) === String(commentId)}
                />
              ))}

              <ListState
                isLoading={commentsLoading}
                isError={commentsError}
                error={commentsErrorValue}
                isEmpty={comments.length === 0}
                emptyMessage="Be the first to comment on this post!"
                errorMessage="Could not load comments"
                onRetry={refetchComments}
              />

              {hasNextPage && (
                <Pressable
                  onPress={() => !isFetchingNextPage && fetchNextPage()}
                  style={styles.loadMoreButton}
                >
                  {isFetchingNextPage ? (
                    <Loading size="small" />
                  ) : (
                    <Text style={styles.retryText}>Load more comments</Text>
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
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
    gap: 12,
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
  commentList: {
    gap: 20,
    marginVertical: 15,
  },
  mutedText: {
    textAlign: "center",
    color: theme.colors.textLight,
  },
  retryButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: theme.colors?.gray ?? "#e5e5e5",
  },
  loadMoreButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: theme.colors?.gray ?? "#e5e5e5",
  },
  retryText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: theme.fonts.semibold,
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
