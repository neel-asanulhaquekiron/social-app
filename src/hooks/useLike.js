import { patchLike } from "@/lib/postCache";
import { queryKeys } from "@/lib/queryClient";
import { createPostLike, removePostLike } from "@/services/postService";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Optimistic like toggle for one post.
 *
 * The update is written into every cache holding that post, so liking from
 * the detail screen is reflected on the feed immediately (and vice versa).
 */
export const useLike = (postId) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (nextLiked) =>
      nextLiked ? createPostLike(postId) : removePostLike(postId),
    onMutate: async (nextLiked) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.post(postId) });
      patchLike(queryClient, postId, nextLiked);
      return { previousLiked: !nextLiked };
    },
    onError: (error, _nextLiked, context) => {
      patchLike(queryClient, postId, context?.previousLiked ?? false);
      console.error("Error liking/unliking post:", error.message);
    },
    onSuccess: () => {
      // The server also creates the owner's notification + push after a like.
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
    },
  });

  return { toggleLike: mutate, isPending };
};
