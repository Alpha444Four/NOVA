const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const PRODUCTS = [
  { id: 1, name: "Minimalist Leather Tote", category: "Fashion", price: 189, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80", description: "Hand-stitched full-grain leather tote.", featured: 1, stock: 24 },
  { id: 2, name: "Merino Wool Sweater", category: "Fashion", price: 128, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80", description: "Ultra-soft merino, ethically sourced.", featured: 1, stock: 40 },
  { id: 3, name: "Slim Fit Chinos", category: "Fashion", price: 89, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80", description: "Stretch cotton chinos for everyday wear.", featured: 0, stock: 55 },
  { id: 4, name: "Wireless Noise-Canceling Earbuds", category: "Tech", price: 199, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80", description: "30-hour battery, premium sound.", featured: 1, stock: 30 },
  { id: 5, name: "Aluminum Laptop Stand", category: "Tech", price: 79, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80", description: "Ergonomic stand for any laptop.", featured: 0, stock: 60 },
  { id: 6, name: "Mechanical Keyboard", category: "Tech", price: 149, image: "https://images.unsplash.com/photo-1587829741301-dc798b03add5?w=600&q=80", description: "Hot-swappable switches, RGB backlight.", featured: 1, stock: 18 },
  { id: 7, name: "Ceramic Pour-Over Set", category: "Home", price: 68, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", description: "Artisan ceramic dripper and carafe.", featured: 0, stock: 35 },
  { id: 8, name: "Linen Duvet Cover", category: "Home", price: 159, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", description: "Breathable European flax linen.", featured: 1, stock: 22 },
  { id: 9, name: "Scented Soy Candle", category: "Home", price: 42, image: "https://images.unsplash.com/photo-1602607504338-3f3a3f3f3f3f?w=600&q=80", description: "Hand-poured cedar & sage.", featured: 0, stock: 80 },
  { id: 10, name: "Canvas Weekender", category: "Fashion", price: 145, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80", description: "Waxed canvas travel bag.", featured: 0, stock: 28 },
  { id: 11, name: "Smart Watch Band", category: "Tech", price: 49, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=80", description: "Italian leather, quick-release.", featured: 0, stock: 70 },
  { id: 12, name: "Bamboo Desk Organizer", category: "Home", price: 55, image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80", description: "Sustainable bamboo desktop caddy.", featured: 0, stock: 45 },
];

function createStore() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@nova.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "NovaAdmin2026!";
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  return {
    users: [
      {
        id: 1,
        name: "NOVA Admin",
        email: adminEmail,
        password_hash: adminHash,
        role: "admin",
        created_at: new Date().toISOString(),
      },
    ],
    products: PRODUCTS.map((p) => ({ ...p })),
    orders: [],
    newsletter: [],
    nextUserId: 2,
    nextOrderId: 1,
  };
}

let store = createStore();
let pgPool = null;
let dbMode = "memory";
let dbReady = Promise.resolve();

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

function hasValidDatabaseUrl() {
  const url = getDatabaseUrl();
  if (!url || url.includes("[YOUR-PASSWORD]") || url.includes("://postgres:@")) return false;
  return /^postgres(ql)?:\/\//i.test(url);
}

function shouldUsePostgres() {
  if (process.env.USE_SUPABASE_DB === "false") return false;
  if (process.env.USE_SUPABASE_DB === "true") return hasValidDatabaseUrl();
  // Vercel ↔ Supabase integration injects POSTGRES_URL without USE_SUPABASE_DB
  if (process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) return hasValidDatabaseUrl();
  return false;
}

async function ensureSchema() {
  const migrationPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260328000000_nova_schema.sql"
  );
  if (!fs.existsSync(migrationPath)) return;
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pgPool.query(sql);
}

function usePg() {
  return Boolean(pgPool);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    description: row.description,
    featured: row.featured ? 1 : 0,
    stock: row.stock,
  };
}

async function seedPostgres() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@nova.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "NovaAdmin2026!";
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  const { rows: users } = await pgPool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (!users.length) {
    await pgPool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      ["NOVA Admin", adminEmail, adminHash]
    );
    console.log("Postgres: seeded admin user");
  }

  const { rows: prodCount } = await pgPool.query("SELECT COUNT(*)::int AS c FROM products");
  if (prodCount[0].c === 0) {
    for (const p of PRODUCTS) {
      await pgPool.query(
        `INSERT INTO products (name, category, price, image, description, featured, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.name, p.category, p.price, p.image, p.description, p.featured, p.stock]
      );
    }
    console.log("Postgres: seeded products");
  }
}

async function initDb() {
  if (shouldUsePostgres()) {
    try {
      const { Pool } = require("pg");
      pgPool = new Pool({
        connectionString: getDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
        max: 3,
      });
      await pgPool.query("SELECT 1");
      await ensureSchema();
      await seedPostgres();
      dbMode = "postgres";
      console.log("Database: Supabase Postgres");
      return dbMode;
    } catch (err) {
      console.warn("Postgres unavailable, using in-memory store:", err.message);
      pgPool = null;
    }
  }
  dbMode = "memory";
  console.log(
    "Database: in-memory (link Supabase on Vercel or set USE_SUPABASE_DB=true + DATABASE_URL)"
  );
  return dbMode;
}

dbReady = initDb();

async function getProducts({ category, q, sort } = {}) {
  if (pgPool) {
    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length} OR LOWER(COALESCE(description,'')) LIKE $${params.length})`;
    }
    if (sort === "price-asc") sql += " ORDER BY price ASC";
    else if (sort === "price-desc") sql += " ORDER BY price DESC";
    else if (sort === "name") sql += " ORDER BY name ASC";
    else sql += " ORDER BY featured DESC, id ASC";
    const { rows } = await pgPool.query(sql, params);
    return rows.map(mapProductRow);
  }

  let items = [...store.products];
  if (category) items = items.filter((p) => p.category === category);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        (p.description || "").toLowerCase().includes(needle)
    );
  }
  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  else if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  else items.sort((a, b) => b.featured - a.featured || a.id - b.id);
  return items;
}

async function findUserByEmail(email) {
  if (pgPool) {
    const { rows } = await pgPool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    return rows[0] || null;
  }
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

async function findUserById(id) {
  if (pgPool) {
    const { rows } = await pgPool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] || null;
  }
  return store.users.find((u) => u.id === id) || null;
}

async function verifyPassword(user, password) {
  if (!user?.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}

async function createUser({ name, email, password, role = "user" }) {
  const hash = bcrypt.hashSync(password, 10);
  const normalized = email.toLowerCase();

  if (pgPool) {
    const { rows } = await pgPool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, normalized, hash, role]
    );
    return rows[0];
  }

  const user = {
    id: store.nextUserId++,
    name,
    email: normalized,
    password_hash: hash,
    role,
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  return user;
}

async function getProductById(id) {
  if (pgPool) {
    const { rows } = await pgPool.query("SELECT * FROM products WHERE id = $1", [id]);
    return rows[0] ? mapProductRow(rows[0]) : null;
  }
  return store.products.find((p) => p.id === id) || null;
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }
  return items.map((item) => {
    const productId = Number(item.productId ?? item.product_id);
    const qty = Number(item.qty);
    const price = Number(item.price);
    if (!productId || !item.name || !qty || qty < 1 || !price) {
      throw new Error("Invalid cart item");
    }
    return { productId, name: String(item.name), price, qty };
  });
}

function computeOrderTotals(items, applyDiscount) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = applyDiscount ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  return { subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100 };
}

async function createOrder(userId, items, shipping = {}, options = {}) {
  const lineItems = normalizeOrderItems(items);
  const paymentMethod = options.paymentMethod === "cod" ? "cod" : "card";
  const { discount, total } = computeOrderTotals(lineItems, Boolean(options.applyDiscount));
  const ship = {
    name: String(shipping.name || "").trim(),
    address: String(shipping.address || "").trim(),
    city: String(shipping.city || "").trim(),
    zip: String(shipping.zip || "").trim(),
    email: String(shipping.email || "").trim().toLowerCase(),
  };
  if (!ship.name || !ship.address || !ship.city || !ship.zip || !ship.email) {
    throw new Error("Complete shipping details required");
  }
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, total, discount, payment_method, payment_status, order_status,
          shipping_name, shipping_address, shipping_city, shipping_zip, shipping_email)
         VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10) RETURNING *`,
        [
          userId,
          total,
          discount,
          paymentMethod,
          paymentMethod === "cod" ? "pending" : "authorized",
          ship.name,
          ship.address,
          ship.city,
          ship.zip,
          ship.email,
        ]
      );
      const order = orderRows[0];
      for (const item of lineItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES ($1,$2,$3,$4,$5)`,
          [order.id, item.productId, item.name, item.price, item.qty]
        );
      }
      await client.query("COMMIT");
      return formatOrder(order, lineItems);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  const order = {
    id: store.nextOrderId++,
    user_id: userId,
    total,
    discount,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "cod" ? "pending" : "authorized",
    order_status: "pending",
    shipping_name: ship.name,
    shipping_address: ship.address,
    shipping_city: ship.city,
    shipping_zip: ship.zip,
    shipping_email: ship.email,
    created_at: new Date().toISOString(),
  };
  store.orders.unshift({ ...order, items: lineItems });
  return formatOrder(order, lineItems);
}

function formatOrder(order, items) {
  return {
    id: order.id,
    total: Number(order.total),
    discount: Number(order.discount || 0),
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    shippingName: order.shipping_name,
    shippingCity: order.shipping_city,
    createdAt: order.created_at,
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: Number(i.price),
      qty: i.qty,
    })),
  };
}

async function getOrdersForUser(userId) {
  if (pgPool) {
    const { rows: orders } = await pgPool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    const result = [];
    for (const o of orders) {
      const { rows: items } = await pgPool.query(
        "SELECT product_id, name, price, qty FROM order_items WHERE order_id = $1",
        [o.id]
      );
      result.push({
        id: o.id,
        total: Number(o.total),
        discount: Number(o.discount),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        orderStatus: o.order_status,
        shippingName: o.shipping_name,
        shippingCity: o.shipping_city,
        createdAt: o.created_at,
        items: items.map((i) => ({
          productId: i.product_id,
          name: i.name,
          price: Number(i.price),
          qty: i.qty,
        })),
      });
    }
    return result;
  }

  return store.orders
    .filter((o) => o.user_id === userId)
    .map((o) => ({
      id: o.id,
      total: o.total,
      discount: o.discount,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      orderStatus: o.order_status,
      shippingName: o.shipping_name,
      shippingCity: o.shipping_city,
      createdAt: o.created_at,
      items: o.items,
    }));
}

async function subscribeNewsletter(email) {
  const normalized = email.toLowerCase().trim();
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [normalized]
    );
    return { ok: true, email: normalized };
  }
  if (!store.newsletter.includes(normalized)) store.newsletter.push(normalized);
  return { ok: true, email: normalized };
}

async function isNewsletterSubscriber(email) {
  const normalized = (email || "").toLowerCase().trim();
  if (pgPool) {
    const { rows } = await pgPool.query(
      "SELECT 1 FROM newsletter_subscribers WHERE LOWER(email) = $1",
      [normalized]
    );
    return rows.length > 0;
  }
  return store.newsletter.includes(normalized);
}

async function adminStats() {
  if (pgPool) {
    const [{ rows: counts }, { rows: revenueRows }, { rows: recentOrders }, { rows: recentUsers }] =
      await Promise.all([
        pgPool.query(`
          SELECT
            (SELECT COUNT(*)::int FROM products) AS products,
            (SELECT COUNT(*)::int FROM orders) AS orders,
            (SELECT COUNT(*)::int FROM users WHERE role = 'user') AS customers
        `),
        pgPool.query("SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders"),
        pgPool.query(
          "SELECT id, total, order_status AS status, created_at FROM orders ORDER BY created_at DESC LIMIT 5"
        ),
        pgPool.query(
          "SELECT id, name, email, role, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC LIMIT 5"
        ),
      ]);

    const c = counts[0];
    return {
      products: c.products,
      orders: c.orders,
      customers: c.customers,
      revenue: Number(revenueRows[0].revenue),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at,
      })),
      recentUsers: recentUsers.map(publicUser),
    };
  }

  const revenue = store.orders.reduce((sum, o) => sum + o.total, 0);
  return {
    products: store.products.length,
    orders: store.orders.length,
    customers: store.users.filter((u) => u.role === "user").length,
    revenue,
    recentOrders: store.orders.slice(0, 5).map((o) => ({
      id: o.id,
      total: o.total,
      status: o.order_status,
      createdAt: o.created_at,
    })),
    recentUsers: store.users
      .filter((u) => u.role === "user")
      .slice(-5)
      .reverse()
      .map(publicUser),
  };
}

async function getAdminProducts() {
  return getProducts({});
}

async function getAdminOrders() {
  if (pgPool) {
    const { rows: orders } = await pgPool.query("SELECT * FROM orders ORDER BY created_at DESC");
    const result = [];
    for (const o of orders) {
      const { rows: items } = await pgPool.query(
        "SELECT product_id, name, price, qty FROM order_items WHERE order_id = $1",
        [o.id]
      );
      result.push({
        id: o.id,
        userId: o.user_id,
        total: Number(o.total),
        orderStatus: o.order_status,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        shippingName: o.shipping_name,
        createdAt: o.created_at,
        items,
      });
    }
    return result;
  }
  return store.orders.map((o) => ({
    id: o.id,
    userId: o.user_id,
    total: o.total,
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,
    shippingName: o.shipping_name,
    createdAt: o.created_at,
    items: o.items,
  }));
}

async function getAdminUsers() {
  if (pgPool) {
    const { rows } = await pgPool.query("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map(publicUser);
  }
  return store.users.map(publicUser);
}

async function getNewsletterSubscribers() {
  if (pgPool) {
    const { rows } = await pgPool.query(
      "SELECT email FROM newsletter_subscribers ORDER BY created_at DESC"
    );
    return rows.map((r) => r.email);
  }
  return [...store.newsletter];
}

function getMode() {
  return dbMode;
}

module.exports = {
  initDb,
  ready: () => dbReady,
  getMode,
  usePg,
  getProducts,
  findUserByEmail,
  findUserById,
  verifyPassword,
  createUser,
  getProductById,
  publicUser,
  createOrder,
  getOrdersForUser,
  subscribeNewsletter,
  isNewsletterSubscriber,
  isNewsletterSubscribed: isNewsletterSubscriber,
  adminStats,
  getAdminProducts,
  getAdminOrders,
  getAllOrders: getAdminOrders,
  getAdminUsers,
  getAllUsers: getAdminUsers,
  getNewsletterSubscribers,
  get store() {
    return store;
  },
};
