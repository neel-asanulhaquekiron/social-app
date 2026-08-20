import { api } from "@/services/apiClient";

const mockGetSession = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
    },
  },
}));

jest.mock("@/constants", () => ({
  API_BASE_URL: "https://api.test",
  supabaseUrl: "https://test.supabase.co",
  supabasePublishableKey: "test-key",
}));

const withSession = (token: string | null) =>
  mockGetSession.mockResolvedValue({
    data: { session: token ? { access_token: token } : null },
  });

const respond = (status: number, body: string, ok?: boolean) =>
  ({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    text: async () => body,
  }) as Response;

describe("api client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withSession("token-123");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
  });

  it("returns the parsed body on success", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respond(200, JSON.stringify({ success: true, data: [1] })),
      );

    const result = await api.get<{ data: number[] }>("/posts");

    expect(result).toEqual({ success: true, data: [1] });
  });

  it("sends the bearer token from the session", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(respond(200, JSON.stringify({ success: true })));
    global.fetch = fetchMock;

    await api.get("/posts");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/posts");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer token-123",
    );
  });

  it("omits the Authorization header when signed out", async () => {
    withSession(null);
    const fetchMock = jest
      .fn()
      .mockResolvedValue(respond(200, JSON.stringify({ success: true })));
    global.fetch = fetchMock;

    await api.get("/posts");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("turns a non-2xx JSON body into a failure carrying the server message", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respond(404, JSON.stringify({ success: false, msg: "Post not found" })),
      );

    const result = await api.get("/posts/999");

    expect(result).toMatchObject({
      success: false,
      msg: "Post not found",
      status: 404,
    });
  });

  it("does not throw on an HTML error page", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(respond(502, "<html>Bad Gateway</html>"));

    const result = await api.get("/posts");

    expect(result.success).toBe(false);
    expect((result as { status?: number }).status).toBe(502);
  });

  it("signs out on a 401 when a token was sent", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respond(401, JSON.stringify({ success: false, msg: "no" })),
      );

    await api.get("/users/me");

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("does not sign out on a 401 when no token was sent", async () => {
    withSession(null);
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respond(401, JSON.stringify({ success: false, msg: "no" })),
      );

    await api.get("/users/me");

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("reports a timeout distinctly from a network failure", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    global.fetch = jest.fn().mockRejectedValue(abortError);

    const result = await api.get("/posts");

    expect(result.success).toBe(false);
    expect((result as { msg: string }).msg).toMatch(/timed out/i);
  });

  it("reports an unreachable server", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    const result = await api.get("/posts");

    expect((result as { msg: string }).msg).toMatch(/could not reach/i);
  });

  it("serialises a body for POST", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(respond(201, JSON.stringify({ success: true })));
    global.fetch = fetchMock;

    await api.post("/posts", { body: "hi" });

    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ body: "hi" }),
    );
  });

  it("sends no body for DELETE", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(respond(200, JSON.stringify({ success: true })));
    global.fetch = fetchMock;

    await api.delete("/posts/1/like");

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });
});
