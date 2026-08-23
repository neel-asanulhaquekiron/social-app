const request = require("supertest");
const {
  TEST_USER,
  OTHER_USER,
  tokenFor,
  installAuthMock,
} = require("./helpers/testApp");

// Models are mocked: these suites are about routing, authentication,
// validation and status mapping — not about Supabase behaviour.
jest.mock("../models/post");
jest.mock("../models/user");
jest.mock("../models/notification");
jest.mock("../services/notificationService", () => ({
  notifyPostOwner: jest.fn(),
  enqueue: jest.fn(),
}));

installAuthMock();

const app = require("../app");
const Post = require("../models/post");
const User = require("../models/user");
const Notification = require("../models/notification");

const auth = (user = TEST_USER) => `Bearer ${tokenFor(user)}`;
const ok = (payload) => ({ success: true, ...payload });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("health", () => {
  it("responds without authentication", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("authentication", () => {
  const protectedRoutes = [
    ["post", "/posts"],
    ["get", "/users/me"],
    ["get", "/notifications"],
    ["post", "/notifications/mark-seen"],
    ["post", "/users/registerPushToken"],
    ["delete", "/users/pushToken"],
  ];

  it.each(protectedRoutes)(
    "%s %s is 401 without a token",
    async (method, url) => {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    },
  );

  it.each(protectedRoutes)(
    "%s %s is 401 with a garbage token",
    async (method, url) => {
      const res = await request(app)
        [method](url)
        .set("Authorization", "Bearer garbage.token.here");
      expect(res.status).toBe(401);
    },
  );

  it("never returns HTML, even for unknown routes", async () => {
    const res = await request(app).get("/definitely-not-a-route");
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ success: false, msg: expect.any(String) }),
    );
  });
});

describe("identity binding (IDOR)", () => {
  it("attributes a new post to the token's user, not a body-supplied userId", async () => {
    Post.createPost.mockResolvedValue(ok({ data: { id: 1 } }));

    await request(app)
      .post("/posts")
      .set("Authorization", auth(TEST_USER))
      .send({ body: "hello", userId: OTHER_USER.id });

    expect(Post.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ userId: TEST_USER.id }),
    );
  });

  it("registers a push token against the caller, ignoring any body userId", async () => {
    User.registerPushToken.mockResolvedValue(ok({}));

    await request(app)
      .post("/users/registerPushToken")
      .set("Authorization", auth(TEST_USER))
      .send({ pushToken: "ExponentPushToken[x]", userId: OTHER_USER.id });

    expect(User.registerPushToken).toHaveBeenCalledWith(
      TEST_USER.id,
      "ExponentPushToken[x]",
    );
  });

  it("scopes notification listing to the caller", async () => {
    Notification.fetchNotifications.mockResolvedValue(
      ok({ data: [], nextCursor: null }),
    );

    await request(app)
      .get("/notifications")
      .set("Authorization", auth(OTHER_USER));

    expect(Notification.fetchNotifications).toHaveBeenCalledWith(
      OTHER_USER.id,
      expect.any(Object),
    );
  });

  it("scopes marking a notification clicked to the caller", async () => {
    Notification.markNotificationAsClicked.mockResolvedValue(ok({ data: {} }));

    await request(app)
      .patch("/notifications/5/clicked")
      .set("Authorization", auth(OTHER_USER));

    expect(Notification.markNotificationAsClicked).toHaveBeenCalledWith(
      5,
      OTHER_USER.id,
    );
  });

  it("passes the caller as the requester when deleting a comment", async () => {
    Post.deleteComment.mockResolvedValue(ok({}));

    await request(app)
      .delete("/posts/3/comment/9")
      .set("Authorization", auth(TEST_USER));

    expect(Post.deleteComment).toHaveBeenCalledWith(9, 3, TEST_USER.id);
  });

  it("returns 403 when the model rejects the requester", async () => {
    Post.deleteComment.mockResolvedValue({
      success: false,
      msg: "Not allowed to delete this comment",
      code: "forbidden",
    });

    const res = await request(app)
      .delete("/posts/3/comment/9")
      .set("Authorization", auth(OTHER_USER));

    expect(res.status).toBe(403);
  });
});

describe("validation", () => {
  it("rejects an empty post body", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", auth())
      .send({ body: "   " });

    expect(res.status).toBe(400);
    expect(Post.createPost).not.toHaveBeenCalled();
  });

  it("rejects a post body over the limit", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", auth())
      .send({ body: "x".repeat(3001) });

    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric post id", async () => {
    const res = await request(app).get("/posts/not-a-number");
    expect(res.status).toBe(400);
  });

  it("rejects an empty comment", async () => {
    const res = await request(app)
      .post("/posts/1/comment")
      .set("Authorization", auth())
      .send({ text: "" });

    expect(res.status).toBe(400);
    expect(Post.createComment).not.toHaveBeenCalled();
  });

  it("rejects a push token that is missing", async () => {
    const res = await request(app)
      .post("/users/registerPushToken")
      .set("Authorization", auth())
      .send({});

    expect(res.status).toBe(400);
  });

  it("caps the page limit", async () => {
    const res = await request(app).get("/posts/?limit=5000");
    expect(res.status).toBe(400);
  });

  it("answers 400 for malformed JSON instead of an HTML error page", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", auth())
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("public routes read the token when present", () => {
  it("passes no viewer when signed out", async () => {
    Post.fetchPosts.mockResolvedValue(ok({ data: [], nextCursor: null }));

    await request(app).get("/posts/?limit=5");

    expect(Post.fetchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: null }),
    );
  });

  it("passes the viewer when a valid token is sent", async () => {
    Post.fetchPosts.mockResolvedValue(ok({ data: [], nextCursor: null }));

    await request(app).get("/posts/?limit=5").set("Authorization", auth());

    expect(Post.fetchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: TEST_USER.id }),
    );
  });

  it("still serves the feed when the token is invalid", async () => {
    Post.fetchPosts.mockResolvedValue(ok({ data: [], nextCursor: null }));

    const res = await request(app)
      .get("/posts/?limit=5")
      .set("Authorization", "Bearer garbage");

    expect(res.status).toBe(200);
    expect(Post.fetchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: null }),
    );
  });
});

describe("happy paths", () => {
  it("creates a post with 201", async () => {
    Post.createPost.mockResolvedValue(ok({ data: { id: 12 } }));

    const res = await request(app)
      .post("/posts")
      .set("Authorization", auth())
      .send({ body: "hello world" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { id: 12 } });
  });

  it("returns a paginated feed", async () => {
    Post.fetchPosts.mockResolvedValue(
      ok({ data: [{ id: 1 }], nextCursor: "abc" }),
    );

    const res = await request(app).get("/posts/?limit=1");

    expect(res.status).toBe(200);
    expect(res.body.nextCursor).toBe("abc");
  });

  it("passes the cursor through to the model", async () => {
    Post.fetchPosts.mockResolvedValue(ok({ data: [], nextCursor: null }));

    await request(app).get("/posts/?limit=2&cursor=abc123");

    expect(Post.fetchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "abc123", limit: 2 }),
    );
  });

  it("returns 404 when a post is missing", async () => {
    Post.fetchPostById.mockResolvedValue({
      success: false,
      msg: "Post not found",
      code: "not_found",
    });

    const res = await request(app).get("/posts/999");
    expect(res.status).toBe(404);
  });

  it("returns the unseen notification count", async () => {
    Notification.getUnseenNotificationCount.mockResolvedValue(ok({ count: 3 }));

    const res = await request(app)
      .get("/notifications/unseen-count")
      .set("Authorization", auth());

    expect(res.body.count).toBe(3);
  });

  it("recreates a missing profile on /users/me instead of 404ing", async () => {
    User.getUserData.mockResolvedValue({
      success: false,
      msg: "User not found",
      code: "not_found",
    });
    User.ensureProfile.mockResolvedValue(ok({ data: { id: TEST_USER.id } }));

    const res = await request(app)
      .get("/users/me")
      .set("Authorization", auth());

    expect(User.ensureProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: TEST_USER.id }),
    );
    expect(res.status).toBe(200);
  });
});

describe("push token rebinding", () => {
  it("moves a token to the caller rather than leaving it on the previous owner", async () => {
    User.registerPushToken.mockResolvedValue(ok({}));

    await request(app)
      .post("/users/registerPushToken")
      .set("Authorization", auth(OTHER_USER))
      .send({ pushToken: "ExponentPushToken[shared]" });

    // The controller must pass the caller's id; the model releases the token
    // from anyone else holding it.
    expect(User.registerPushToken).toHaveBeenCalledWith(
      OTHER_USER.id,
      "ExponentPushToken[shared]",
    );
  });
});
