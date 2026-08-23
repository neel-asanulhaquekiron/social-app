import { applyCommentEvent, patchCommentCount } from "@/lib/postCache";
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

const countOnDetails = (client: QueryClient, id = 1) =>
  (client.getQueryData(queryKeys.post(id)) as Post).commentCount;

describe("comment count", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
    client.setQueryData(queryKeys.post(1), post({ commentCount: 5 }));
  });

  afterEach(() => {
    client.clear();
    client.unmount();
  });

  it("moves by one for a single realtime insert", () => {
    // The reported bug: posting a comment bumped the visible count by two,
    // because the mutation patched AND realtime delivered the same insert.
    applyCommentEvent(client, { eventType: "INSERT", new: { postId: 1 } });

    expect(countOnDetails(client)).toBe(6);
  });

  it("moves by one for a single realtime delete", () => {
    applyCommentEvent(client, { eventType: "DELETE", old: { postId: 1 } });

    expect(countOnDetails(client)).toBe(4);
  });

  it("ignores updates, which cannot change how many comments exist", () => {
    applyCommentEvent(client, { eventType: "UPDATE", new: { postId: 1 } });

    expect(countOnDetails(client)).toBe(5);
  });

  it("ignores an event with no post id", () => {
    applyCommentEvent(client, { eventType: "INSERT", new: {} });

    expect(countOnDetails(client)).toBe(5);
  });

  it("demonstrates the double-count if two paths both patch", () => {
    // Documents why applyCommentEvent must be the only caller: two patches
    // for one comment is exactly what the user saw.
    patchCommentCount(client, 1, 1);
    patchCommentCount(client, 1, 1);

    expect(countOnDetails(client)).toBe(7);
  });
});
