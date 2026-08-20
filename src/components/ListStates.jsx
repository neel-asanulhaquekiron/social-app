import Loading from "@/components/Loading";
import { hp } from "@/helpers/common";
import { makeStyles } from "@/hooks/useTheme";
import { Pressable, Text, View } from "react-native";

/**
 * Shared loading / empty / error states.
 *
 * Every list previously invented its own, which is how the feed ended up
 * showing "No posts found" while the first request was still in flight and
 * how the notifications screen ended up with no way to retry at all.
 */

export const LoadingState = ({ compact = false }) => {
  const styles = useStyles();

  return (
    <View style={compact ? styles.compact : styles.block}>
      <Loading size={compact ? "small" : "large"} />
    </View>
  );
};

export const EmptyState = ({ message }) => {
  const styles = useStyles();

  return (
    <View style={styles.block}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
};

export const ErrorState = ({ message, onRetry }) => {
  const styles = useStyles();

  return (
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
};

export const EndMessage = ({ message }) => {
  const styles = useStyles();

  return <Text style={styles.endText}>{message}</Text>;
};

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

  // Deliberately hook-free so it stays a pure function of its props — which
  // is what lets it be unit tested without a renderer.
  return endMessage ? <EndMessage message={endMessage} /> : null;
};

const useStyles = makeStyles((theme) => ({
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
}));
