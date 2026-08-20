// The contract every API call returns. Modelled as a discriminated union so
// TypeScript forces a `success` check before `data` can be read — the exact
// mistake that shipped in postDetails, which destructured `{ error, data }`
// from a response that never had an `error` field.

export type ApiFailure = {
  success: false;
  msg: string;
  /** HTTP status, absent for network/timeout failures. */
  status?: number;
  code?: string;
};

export type ApiSuccess<T> = { success: true } & T;

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/** A paginated list: keyset cursor, null when the list is exhausted. */
export type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
};

export type PublicUser = {
  id: string;
  name: string | null;
  created_at?: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  name: string | null;
};

export type Post = {
  id: number;
  body: string;
  userId: string;
  created_at: string;
  user?: PublicUser;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type Comment = {
  id: number;
  postId: number;
  userId: string;
  text: string;
  created_at: string;
  user?: PublicUser;
};

export type AppNotification = {
  id: number;
  senderId: string;
  receiverId: string;
  title: string;
  /** jsonb; legacy rows may still hold a JSON string. */
  data: Record<string, unknown> | string | null;
  isSeen: boolean;
  isClicked: boolean;
  created_at: string;
  sender?: PublicUser;
};
