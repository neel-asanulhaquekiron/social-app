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

const bearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length) || null;
};

const verify = (token) =>
  new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      { algorithms: ["ES256"], audience: "authenticated" },
      (err, payload) => {
        if (err || !payload?.sub)
          return reject(err ?? new Error("invalid token"));

        // Supabase puts the user id in `sub`; name lives in user_metadata.
        resolve({
          id: payload.sub,
          email: payload.email,
          name: payload.user_metadata?.name ?? null,
        });
      },
    );
  });

const auth = async (req, res, next) => {
  const token = bearerToken(req);

  if (!token) {
    return res.status(401).json({ success: false, msg: "Unauthorized" });
  }

  try {
    req.user = await verify(token);
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, msg: "Invalid or expired token" });
  }
};

/**
 * For public routes that personalise their response when a caller happens to
 * be signed in (e.g. `likedByMe`). A missing or bad token is not an error —
 * the request continues with `req.user` left undefined.
 */
auth.optional = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    req.user = await verify(token);
  } catch {
    // Ignored on purpose: the route is public.
  }

  next();
};

module.exports = auth;
