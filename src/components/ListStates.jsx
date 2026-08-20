import Loading from "@/components/Loading";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Shared loading / empty / error states.
 *
 * Every list previously invented its own, which is how the feed ended up
 * showing "No posts found" while the first request was still in flight and
 * how the notifications screen ended up with no way to retry at all.
 */

export const LoadingState = ({ compact = false }) => (
  <View style={compact ? styles.compact : styles.block}>
    <Loading size={compact ? "small" : "large"} />
  </View>
);

export const EmptyState = ({ message }) => (
  <View style={styles.block}>
    <Text style={styles.muted}>{message}</Text>
  </View>
);

export const ErrorState = ({ message, onRetry }) => (
  <View style={styles.block}>
    <Text style={styles.muted}>{message || "Something went wrong"}</Text>
    {onRetry && (
      <Pressable
        onPress={onRetry}
        style={styles.retryButton}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        hitSlop={8}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    )}
  </View>
);

/**
 * Picks the right state for a react-query backed list, in the order that
 * matters: still loading beats empty, so an empty message can't flash while
 * the first page is in flight.
 */
export const ListState = ({
  isLoading,
  isError,
  error,
  isEmpty,
  isFetchingMore,
  emptyMessage,
  errorMessage,
  endMessage,
  onRetry,
}) => {
  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <ErrorState message={error?.message || errorMessage} onRetry={onRetry} />
    );
  }

  if (isEmpty) return <EmptyState message={emptyMessage} />;

  if (isFetchingMore) return <LoadingState compact />;

  return endMessage ? <Text style={styles.endText}>{endMessage}</Text> : null;
};

const styles = StyleSheet.create({
  block: {
    marginVertical: 30,
    gap: 12,
    alignItems: "center",
  },
  compact: {
    marginVertical: 20,
  },
  muted: {
    textAlign: "center",
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  endText: {
    textAlign: "center",
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginVertical: 20,
  },
  retryButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray,
  },
  retryText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: theme.fonts.semiBold,
  },
});
