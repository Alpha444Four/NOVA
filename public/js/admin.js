(async function () {
  const toast = document.getElementById("adm-toast");
  const body = document.getElementById("adm-body");
  const app = document.getElementById("adm-app");
  const loader = document.getElementById("adm-loader");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2500);
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  if (!(await NovaAuth.ensureServer())) return;
  const user = await NovaAuth.getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "login.html?from=/admin.html&reason=admin";
    return;
  }

  document.getElementById("adm-admin-name").textContent = user.name;
  document.getElementById("adm-avatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("adm-logout")?.addEventListener("click", async () => {
    await NovaAuth.logout();
    window.location.href = "login.html";
  });

  async function loadDashboard() {
    const stats = await api("/api/admin/stats");
    document.getElementById("adm-stats").innerHTML = `
      <div class="adm-stat"><span>Products</span><strong>${stats.products}</strong></div>
      <div class="adm-stat"><span>Orders</span><strong>${stats.orders}</strong></div>
      <div class="adm-stat"><span>Customers</span><strong>${stats.customers}</strong></div>
      <div class="adm-stat"><span>Revenue</span><strong>$${stats.revenue.toFixed(2)}</strong></div>`;
    document.getElementById("dash-recent-orders").innerHTML =
      stats.recentOrders.map((o) => `<p>#${o.id} · $${o.total.toFixed(2)} · ${o.status}</p>`).join("") ||
      "<p>No orders yet.</p>";
    document.getElementById("dash-recent-users").innerHTML =
      stats.recentUsers.map((u) => `<p>${u.name} · ${u.email}</p>`).join("") || "<p>No customers yet.</p>";
  }

  async function loadProducts() {
    const { products } = await api("/api/admin/products");
    document.getElementById("products-tbody").innerHTML = products
      .map(
        (p) => `<tr>
        <td>${p.name}</td><td>${p.category}</td>
        <td>$${p.price}</td><td>—</td><td>${p.stock}</td><td>—</td>
      </tr>`
      )
      .join("");
  }

  async function loadOrders() {
    const { orders } = await api("/api/admin/orders");
    document.getElementById("admin-orders-list").innerHTML = orders.length
      ? orders
          .map(
            (o) => `<article class="adm-order-card">
        <strong>#${o.id}</strong> · ${o.shippingName} · $${o.total.toFixed(2)}
        <span>${o.orderStatus}</span> · ${o.paymentMethod}
      </article>`
          )
          .join("")
      : "<p>No orders yet.</p>";
  }

  async function loadCustomers() {
    const { users } = await api("/api/admin/users");
    document.getElementById("users-tbody").innerHTML = users
      .filter((u) => u.role === "user")
      .map(
        (u) =>
          `<tr><td>${u.name}</td><td>${u.email}</td><td>—</td><td>—</td><td>active</td><td>—</td></tr>`
      )
      .join("");
  }

  async function loadNewsletter() {
    const { subscribers } = await api("/api/admin/newsletter");
    document.getElementById("newsletter-tbody").innerHTML =
      subscribers
        .map((e) => `<tr><td>${e}</td><td>yes</td><td></td></tr>`)
        .join("") || "<tr><td colspan='3'>No subscribers yet.</td></tr>";
  }

  const panels = {
    dashboard: loadDashboard,
    products: loadProducts,
    orders: loadOrders,
    customers: loadCustomers,
    newsletter: loadNewsletter,
  };

  document.querySelectorAll(".adm-nav__btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".adm-nav__btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const panel = btn.dataset.panel;
      document.querySelectorAll(".adm-panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(`panel-${panel}`)?.classList.add("active");
      document.getElementById("adm-title").textContent =
        panel.charAt(0).toUpperCase() + panel.slice(1);
      try {
        await panels[panel]?.();
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  loader.hidden = true;
  app.hidden = false;
  body.classList.remove("adm--loading");
  await loadDashboard();
})();
