import {
  patchCommentCount,
  patchLike,
  updateCachedPost,
} from "@/lib/postCache";
import { queryKeys } from "@/lib/queryClient";
import type { Post } from "@/types/api";
import { QueryClient } from "@tanstack/react-query";

const post = (over: Partial<Post> = {}): Post => ({
  id: 1,
  body: "hello",
  userId: "u1",
  created_at: "2026-08-20T00:00:00+00:00",
  likeCount: 0,
  commentCount: 0,
  likedByMe: false,
  ...over,
});

const seedFeed = (client: QueryClient, posts: Post[], filter = "") =>
  client.setQueryData(queryKeys.posts(filter), {
    pages: [{ data: posts, nextCursor: null }],
    pageParams: [null],
  });

const feed = (client: QueryClient, filter = "") =>
  (client.getQueryData(queryKeys.posts(filter)) as any).pages[0].data as Post[];

describe("post cache patching", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
  });

  afterEach(() => {
    // Without this the cache's gc timers keep the jest worker alive.
    client.clear();
    client.unmount();
  });

  it("likes a post inside the infinite feed", () => {
    seedFeed(client, [post({ id: 1 }), post({ id: 2 })]);

    patchLike(client, 1, true);

    expect(feed(client)[0]).toMatchObject({ likedByMe: true, likeCount: 1 });
    expect(feed(client)[1]).toMatchObject({ likedByMe: false, likeCount: 0 });
  });

  it("updates every cached filter, not just the active one", () => {
    seedFeed(client, [post({ id: 1 })], "");
    seedFeed(client, [post({ id: 1 })], "alice");

    patchLike(client, 1, true);

    expect(feed(client, "")[0].likedByMe).toBe(true);
    expect(feed(client, "alice")[0].likedByMe).toBe(true);
  });

  it("keeps the feed and the single-post cache in step", () => {
    seedFeed(client, [post({ id: 7 })]);
    client.setQueryData(queryKeys.post(7), post({ id: 7 }));

    patchLike(client, 7, true);

    expect(feed(client)[0].likeCount).toBe(1);
    expect((client.getQueryData(queryKeys.post(7)) as Post).likeCount).toBe(1);
  });

  it("accepts a string id, as route params provide", () => {
    seedFeed(client, [post({ id: 42 })]);

    patchLike(client, "42", true);

    expect(feed(client)[0].likedByMe).toBe(true);
  });

  it("never drives a count below zero", () => {
    seedFeed(client, [post({ id: 1, likeCount: 0, likedByMe: true })]);

    patchLike(client, 1, false);

    expect(feed(client)[0].likeCount).toBe(0);
  });

  it("adjusts comment counts in both directions", () => {
    seedFeed(client, [post({ id: 1, commentCount: 2 })]);

    patchCommentCount(client, 1, 1);
    expect(feed(client)[0].commentCount).toBe(3);

    patchCommentCount(client, 1, -1);
    expect(feed(client)[0].commentCount).toBe(2);
  });

  it("ignores a missing post id instead of corrupting the cache", () => {
    seedFeed(client, [post({ id: 1 })]);

    updateCachedPost(client, null, (p) => ({ ...p, body: "changed" }));
    updateCachedPost(client, undefined, (p) => ({ ...p, body: "changed" }));

    expect(feed(client)[0].body).toBe("hello");
  });

  it("leaves other posts untouched when the id does not match", () => {
    seedFeed(client, [post({ id: 1 }), post({ id: 2 })]);

    patchLike(client, 999, true);

    expect(feed(client).every((p) => !p.likedByMe)).toBe(true);
  });
});
