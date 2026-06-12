#!/usr/bin/env node
/**
 * Pre-deploy verification — exits non-zero on failure.
 */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = 3456 + Math.floor(Math.random() * 500);

const requiredPublic = [
  "index.html",
  "login.html",
  "signup.html",
  "account.html",
  "admin.html",
  "help.html",
  "css/styles.css",
  "css/admin.css",
  "js/app.js",
  "js/auth.js",
  "js/admin.js",
  "assets/favicon.svg",
];

function fail(msg) {
  console.error(`VERIFY FAIL: ${msg}`);
  process.exit(1);
}

function get(pathname, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: PORT, path: pathname, headers },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
      }
    );
    req.on("error", reject);
  });
}

function post(pathname, data, cookie = "") {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path: pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Cookie: cookie,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          const setCookie = res.headers["set-cookie"] || [];
          resolve({ status: res.statusCode, body, cookie: setCookie.join("; ") });
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("Verifying NOVA Store pre-deploy checks…");

  for (const file of requiredPublic) {
    const full = path.join(ROOT, "public", file);
    if (!fs.existsSync(full)) fail(`Missing public/${file}`);
  }

  try {
    require(path.join(ROOT, "index.js"));
  } catch (err) {
    fail(`index.js failed to load: ${err.message}`);
  }

  const child = spawn(process.execPath, ["server/index.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "test", USE_SUPABASE_DB: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let started = false;
  child.stdout.on("data", (d) => {
    if (String(d).includes("NOVA Store")) started = true;
  });
  child.stderr.on("data", (d) => process.stderr.write(d));

  await new Promise((r) => setTimeout(r, 2000));
  if (!started) fail("Server did not start");

  const health = await get("/api/health");
  if (health.status !== 200) fail(`/api/health returned ${health.status}`);
  const healthJson = JSON.parse(health.body);
  if (!healthJson.ok) fail("/api/health ok:false");

  const products = await get("/api/products");
  if (products.status !== 200) fail(`/api/products returned ${products.status}`);
  const productJson = JSON.parse(products.body);
  if (!Array.isArray(productJson.products) || productJson.products.length < 1) {
    fail("/api/products returned no products");
  }

  const reg = await post("/api/auth/register", {
    name: "Verify User",
    email: `verify-${Date.now()}@example.com`,
    password: "password123",
  });
  if (reg.status !== 201) fail(`/api/auth/register returned ${reg.status}: ${reg.body}`);

  const me = await get("/api/auth/me", { Cookie: reg.cookie });
  if (me.status !== 200) fail(`/api/auth/me returned ${me.status}`);

  const admin = await post("/api/auth/login", {
    email: process.env.ADMIN_EMAIL || "admin@nova.com",
    password: process.env.ADMIN_PASSWORD || "NovaAdmin2026!",
  });
  if (admin.status !== 200) fail(`/api/auth/login admin returned ${admin.status}`);

  const stats = await get("/api/admin/stats", { Cookie: admin.cookie });
  if (stats.status !== 200) fail(`/api/admin/stats returned ${stats.status}`);

  for (const file of ["index.html", "css/styles.css", "js/app.js"]) {
    const res = await get(`/${file}`);
    if (res.status !== 200) fail(`GET /${file} returned ${res.status}`);
  }

  const missing = await get("/api/does-not-exist");
  if (missing.status !== 404) fail("Expected JSON 404 for unknown API route");

  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 300));

  console.log("VERIFY OK — all pre-deploy checks passed.");
}

main().catch((err) => fail(err.message));
