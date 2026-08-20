import { channelStatusLogger, supabase } from "@/lib/supabase";
import type { Comment, Paginated, Post } from "@/types/api";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { api } from "./apiClient";

type PageOptions = { limit?: number; cursor?: string | null };
type FeedOptions = PageOptions & { userName?: string | null };

export const createPost = (postData: { body: string }) =>
  api.post<{ data: Post }>("/posts", postData);

export const fetchPosts = ({
  limit = 10,
  cursor = null,
  userName = null,
}: FeedOptions = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);
  if (userName) params.append("username", userName);

  return api.get<Paginated<Post>>(`/posts/?${params.toString()}`);
};

export const fetchPostById = (postId: string | number) =>
  api.get<{ data: Post }>(`/posts/${postId}`);

export const fetchComments = (
  postId: string | number,
  { limit = 20, cursor = null }: PageOptions = {},
) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);

  return api.get<Paginated<Comment>>(
    `/posts/${postId}/comments?${params.toString()}`,
  );
};

export const createPostLike = (postId: string | number) =>
  api.post<{ data: unknown }>(`/posts/${postId}/like`);

export const removePostLike = (postId: string | number) =>
  api.delete<Record<string, never>>(`/posts/${postId}/like`);

export const createComment = (comment: { postId: number; text: string }) =>
  api.post<{ data: Comment }>(`/posts/${comment.postId}/comment`, comment);

export const deleteComment = (
  postId: string | number,
  commentId: string | number,
) => api.delete<Record<string, never>>(`/posts/${postId}/comment/${commentId}`);

// --- realtime -------------------------------------------------------------
// Channels no longer patch component state by hand (which meant fetching a
// user per event and rebuilding rows the server had already shaped). They
// report *that* something changed; the screen invalidates the relevant query
// and react-query refetches once.

type ChangePayload = RealtimePostgresChangesPayload<Record<string, any>>;
type OnChange = (payload: ChangePayload) => void;

const replaceChannel = (topic: string) => {
  const existing = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:${topic}`);

  if (existing) {
    supabase.removeChannel(existing);
  }
};

const changeChannel = (
  topic: string,
  config: { table: string; filter?: string },
  onChange: OnChange,
): RealtimeChannel => {
  replaceChannel(topic);

  return supabase
    .channel(topic)
    .on(
      "postgres_changes" as any,
      { event: "*", schema: "public", ...config },
      (payload: ChangePayload) => onChange(payload),
    )
    .subscribe(channelStatusLogger(topic));
};

export const subscribeToPosts = (onChange: OnChange) =>
  changeChannel("posts", { table: "posts" }, onChange);

export const subscribeToComments = (
  postId: string | number,
  onChange: OnChange,
) =>
  changeChannel(
    `comments:${postId}`,
    { table: "comments", filter: `postId=eq.${postId}` },
    onChange,
  );

export const subscribeToAllComments = (onChange: OnChange) =>
  changeChannel("comments", { table: "comments" }, onChange);

// Scoped to one post: a feed-wide like channel would fire constantly.
export const subscribeToPostLikes = (
  postId: string | number,
  onChange: OnChange,
) =>
  changeChannel(
    `postLikes:${postId}`,
    { table: "postLikes", filter: `postId=eq.${postId}` },
    onChange,
  );
