function getCorsOrigins() {
  const origins = new Set(
    (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  if (process.env.PUBLIC_URL) origins.add(process.env.PUBLIC_URL.replace(/\/$/, ""));
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);

  return origins;
}

function createCorsOptions() {
  const allowed = getCorsOrigins();
  return {
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  };
}

module.exports = { getCorsOrigins, createCorsOptions };
