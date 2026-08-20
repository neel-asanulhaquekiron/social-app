const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const env = require("../config/env");

// Supabase signs access tokens with an asymmetric key (ES256). The public
// keys are served from the project's JWKS endpoint, so verification is fully
// local after the first fetch (cached) — no shared secret involved.
const jwks = jwksClient({
  jwksUri: `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
});

const getKey = (header, callback) => {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized",
    });
  }

  const token = authHeader.slice("Bearer ".length);

  jwt.verify(
    token,
    getKey,
    { algorithms: ["ES256"], audience: "authenticated" },
    (err, payload) => {
      if (err || !payload?.sub) {
        return res.status(401).json({
          success: false,
          msg: "Invalid or expired token",
        });
      }

      // Supabase puts the user id in `sub`; name lives in user_metadata.
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.user_metadata?.name ?? null,
      };

      next();
    },
  );
};

module.exports = auth;
