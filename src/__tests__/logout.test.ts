import { logout } from "@/services/authService";

const order: string[] = [];

const mockSignOut = jest.fn(async () => {
  order.push("signOut");
  return { error: null };
});

// Mimics the real hazard: removeAllChannels() waits for an unsubscribe ack
// that never arrives on a dead socket.
const mockRemoveAllChannels = jest.fn(() => {
  order.push("removeAllChannels");
  return new Promise(() => {});
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
      getSession: async () => ({ data: { session: null } }),
    },
    removeAllChannels: () => mockRemoveAllChannels(),
  },
}));

jest.mock("@/constants", () => ({
  API_BASE_URL: "https://api.test",
  supabaseUrl: "https://test.supabase.co",
  supabasePublishableKey: "test-key",
}));

jest.mock("@/services/notificationPermissions", () => ({
  clearNotificationBadge: jest.fn(() => {
    order.push("clearBadge");
    return new Promise(() => {}); // also hangs
  }),
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock("@/lib/queryClient", () => ({
  queryClient: { clear: jest.fn(() => order.push("cacheCleared")) },
  queryKeys: {},
  unwrap: (r: unknown) => r,
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  multiRemove: jest.fn(async () => order.push("storageCleared")),
}));

describe("logout", () => {
  beforeEach(() => {
    order.length = 0;
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    } as Response);
  });

  it("completes even when realtime teardown never resolves", async () => {
    // The reported bug: logout appeared to do nothing. Anything awaited before
    // signOut can hold the whole flow open indefinitely.
    await expect(logout()).resolves.toBeUndefined();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("signs out before tearing down realtime", async () => {
    await logout();

    expect(order.indexOf("signOut")).toBeGreaterThan(-1);
    expect(order.indexOf("signOut")).toBeLessThan(
      order.indexOf("removeAllChannels"),
    );
  });

  it("clears the query cache and legacy storage", async () => {
    await logout();

    expect(order).toContain("cacheCleared");
    expect(order).toContain("storageCleared");
  });
});
