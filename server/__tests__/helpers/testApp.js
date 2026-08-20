// Shared harness: builds the real app with the JWKS verification replaced by
// a stub, so suites can authenticate as any user without a live Supabase.

const TEST_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "tester@example.com",
  name: "Tester",
};

const OTHER_USER = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "other@example.com",
  name: "Other",
};

/**
 * Tokens are "valid:<userId>" in tests. Anything else is rejected, so the
 * "missing/garbage token" cases exercise the same code path as production.
 */
const tokenFor = (user) => `valid:${user.id}`;

const installAuthMock = () => {
  jest.doMock("jsonwebtoken", () => ({
    verify: (token, _getKey, _options, callback) => {
      if (typeof token === "string" && token.startsWith("valid:")) {
        const id = token.slice("valid:".length);
        const user = [TEST_USER, OTHER_USER].find((u) => u.id === id) ?? {
          id,
          email: "unknown@example.com",
          name: null,
        };
        return callback(null, {
          sub: user.id,
          email: user.email,
          aud: "authenticated",
          user_metadata: { name: user.name },
        });
      }
      return callback(new Error("invalid token"));
    },
  }));

  jest.doMock("jwks-rsa", () => () => ({
    getSigningKey: (_kid, cb) => cb(null, { getPublicKey: () => "test-key" }),
  }));
};

module.exports = { TEST_USER, OTHER_USER, tokenFor, installAuthMock };
