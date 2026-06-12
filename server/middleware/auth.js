const jwt = require("jsonwebtoken");
const db = require("../db");

const COOKIE_NAME = "nova_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    console.warn("JWT_SECRET is not set — auth will fail until you add it in Vercel env vars");
  }
  return "dev-only-jwt-secret-change-me-32chars";
}

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.VERCEL) return true;
  const url = process.env.PUBLIC_URL || "";
  return process.env.NODE_ENV === "production" && url.startsWith("https");
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

async function readUser(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    await db.ready();
    const payload = jwt.verify(token, getJwtSecret());
    const user = await db.findUserById(payload.sub);
    return user ? db.publicUser(user) : null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  readUser(req)
    .then((user) => {
      if (!user) return res.status(401).json({ error: "Authentication required" });
      req.user = user;
      next();
    })
    .catch(next);
}

function requireAdmin(req, res, next) {
  readUser(req)
    .then((user) => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = {
  COOKIE_NAME,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  readUser,
  requireAuth,
  requireAdmin,
};
