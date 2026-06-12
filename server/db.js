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
    orderItems: [],
    newsletter: [],
    nextUserId: 2,
    nextOrderId: 1,
  };
}

let store = createStore();
let pgPool = null;

function hasValidDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url || url.includes("[YOUR-PASSWORD]") || url.includes("://postgres:@")) return false;
  return /^postgres(ql)?:\/\//i.test(url);
}

async function initDb() {
  if (process.env.USE_SUPABASE_DB === "true" && hasValidDatabaseUrl()) {
    try {
      const { Pool } = require("pg");
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await pgPool.query("SELECT 1");
      console.log("Database: Supabase Postgres");
      return "postgres";
    } catch (err) {
      console.warn("Postgres unavailable, using in-memory store:", err.message);
      pgPool = null;
    }
  }
  console.log("Database: in-memory (set USE_SUPABASE_DB=true + DATABASE_URL for Postgres)");
  return "memory";
}

function usePg() {
  return Boolean(pgPool);
}

function getProducts({ category, q, sort } = {}) {
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

function findUserByEmail(email) {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return store.users.find((u) => u.id === id);
}

function createUser({ name, email, password, role = "user" }) {
  const user = {
    id: store.nextUserId++,
    name,
    email: email.toLowerCase(),
    password_hash: bcrypt.hashSync(password, 10),
    role,
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  return user;
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

function createOrder({ userId, items, shipping, paymentMethod, total, discount }) {
  const order = {
    id: store.nextOrderId++,
    user_id: userId,
    total,
    discount: discount || 0,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "cod" ? "pending" : "authorized",
    order_status: "pending",
    shipping_name: shipping.name,
    shipping_address: shipping.address,
    shipping_city: shipping.city,
    shipping_zip: shipping.zip,
    shipping_email: shipping.email,
    created_at: new Date().toISOString(),
    items: items.map((i) => ({
      product_id: i.productId,
      name: i.name,
      price: i.price,
      qty: i.qty,
    })),
  };
  store.orders.unshift(order);
  return order;
}

function getOrdersForUser(userId) {
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

function subscribeNewsletter(email) {
  const normalized = email.toLowerCase().trim();
  if (!store.newsletter.includes(normalized)) store.newsletter.push(normalized);
  return normalized;
}

function isNewsletterSubscriber(email) {
  return store.newsletter.includes((email || "").toLowerCase().trim());
}

function adminStats() {
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

module.exports = {
  initDb,
  usePg,
  getProducts,
  findUserByEmail,
  findUserById,
  createUser,
  publicUser,
  createOrder,
  getOrdersForUser,
  subscribeNewsletter,
  isNewsletterSubscriber,
  adminStats,
  get store() {
    return store;
  },
};
