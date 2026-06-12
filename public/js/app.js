(function () {
  const CART_KEY = "nova-cart";
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  let products = [];
  let activeCategory = "";
  let newsletterEligible = false;

  const formatPrice = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function showToast(msg) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function renderProducts(list) {
    const grid = $("#products-grid");
    const empty = $("#empty-state");
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = list
      .map(
        (p) => `
      <article class="product-card" role="listitem" data-id="${p.id}">
        <button type="button" class="product-card__media" data-open="${p.id}" aria-label="View ${p.name}">
          <img src="${p.image}" alt="" loading="lazy" width="400" height="500">
        </button>
        <div class="product-card__body">
          <span class="product-card__cat">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="product-card__foot">
            <strong>${formatPrice(p.price)}</strong>
            <button type="button" class="btn btn--primary btn--sm" data-add="${p.id}">Add</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  function renderFeatured() {
    const track = $("#featured-track");
    if (!track) return;
    const featured = products.filter((p) => p.featured).slice(0, 6);
    track.innerHTML = featured
      .map(
        (p) => `
      <article class="featured-card" role="listitem">
        <img src="${p.image}" alt="" loading="lazy">
        <div>
          <h3>${p.name}</h3>
          <p>${formatPrice(p.price)}</p>
          <button type="button" class="btn btn--outline btn--sm" data-add="${p.id}">Add to cart</button>
        </div>
      </article>`
      )
      .join("");
  }

  function renderCategories() {
    const cats = [...new Set(products.map((p) => p.category))];
    const cards = $("#category-cards");
    const pills = $("#filter-pills");
    if (cards) {
      cards.innerHTML = cats
        .map(
          (c) => `
        <a href="#shop" class="category-card" data-filter="${c}">
          <span>${c}</span>
          <small>${products.filter((p) => p.category === c).length} items</small>
        </a>`
        )
        .join("");
    }
    if (pills) {
      pills.innerHTML =
        `<button type="button" class="filter-pill active" data-cat="">All</button>` +
        cats
          .map((c) => `<button type="button" class="filter-pill" data-cat="${c}">${c}</button>`)
          .join("");
    }
  }

  function applyFilters() {
    let list = [...products];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    const sort = $("#sort-select")?.value;
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    renderProducts(list);
    const count = $("#product-count");
    if (count) count.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  }

  function addToCart(productId) {
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ productId: product.id, name: product.name, price: product.price, qty: 1 });
    saveCart(cart);
    showToast(`${product.name} added to cart`);
  }

  function renderCart() {
    const cart = getCart();
    const badge = $("#cart-badge");
    const countLabel = $("#cart-count-label");
    const itemsEl = $("#cart-items");
    const subtotalEl = $("#cart-subtotal");
    const checkoutBtn = $("#checkout-btn");
    const shippingNote = $("#shipping-note");
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);

    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    }
    if (countLabel) countLabel.textContent = `(${count})`;
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (checkoutBtn) checkoutBtn.disabled = count === 0;
    if (shippingNote) {
      const remaining = Math.max(0, 75 - total);
      shippingNote.textContent =
        remaining > 0
          ? `Add ${formatPrice(remaining)} more for free shipping`
          : "You qualify for free shipping!";
    }
    if (!itemsEl) return;
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      return;
    }
    itemsEl.innerHTML = cart
      .map(
        (item, idx) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <span>${formatPrice(item.price)} × ${item.qty}</span>
        </div>
        <div class="cart-item__actions">
          <button type="button" data-qty="${idx}" data-delta="-1" aria-label="Decrease">−</button>
          <span>${item.qty}</span>
          <button type="button" data-qty="${idx}" data-delta="1" aria-label="Increase">+</button>
          <button type="button" data-remove="${idx}" aria-label="Remove">×</button>
        </div>
      </div>`
      )
      .join("");
  }

  function openCart(open) {
    const drawer = $("#cart-drawer");
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    products = data.products || [];
    renderFeatured();
    renderCategories();
    applyFilters();
  }

  async function initAuth() {
    if (!(await NovaAuth.ensureServer())) return;
    const user = await NovaAuth.getCurrentUser();
    NovaAuth.renderUserMenu(user, $("#auth-slot"));
    if (user) {
      try {
        const check = await NovaAuth.api("/api/newsletter/check");
        newsletterEligible = check.subscribed;
        const row = $("#checkout-discount-row");
        if (row) row.hidden = !newsletterEligible;
      } catch {
        /* guest checkout path */
      }
    }
  }

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      addToCart(add.dataset.add);
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) {
      const p = products.find((x) => x.id === Number(open.dataset.open));
      if (!p) return;
      const modal = $("#product-modal");
      const content = $("#modal-content");
      if (!modal || !content) return;
      content.innerHTML = `
        <img src="${p.image}" alt="">
        <div>
          <p class="product-card__cat">${p.category}</p>
          <h2 id="modal-title">${p.name}</h2>
          <p>${p.description || ""}</p>
          <strong>${formatPrice(p.price)}</strong>
          <button type="button" class="btn btn--primary" data-add="${p.id}">Add to cart</button>
        </div>`;
      modal.showModal();
    }
    const pill = e.target.closest(".filter-pill");
    if (pill) {
      $$(".filter-pill").forEach((b) => b.classList.remove("active"));
      pill.classList.add("active");
      activeCategory = pill.dataset.cat || "";
      applyFilters();
    }
    const cat = e.target.closest("[data-filter]");
    if (cat && cat.dataset.filter) {
      activeCategory = cat.dataset.filter;
      $$(".filter-pill").forEach((b) => {
        b.classList.toggle("active", b.dataset.cat === activeCategory);
      });
      applyFilters();
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }
    if (e.target.closest("#cart-btn")) openCart(true);
    if (e.target.closest("#cart-close") || e.target.closest("#cart-overlay")) openCart(false);
    if (e.target.closest("#continue-shopping")) openCart(false);
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) {
      const cart = getCart();
      const idx = Number(qtyBtn.dataset.qty);
      const delta = Number(qtyBtn.dataset.delta);
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      saveCart(cart);
    }
    if (e.target.closest("[data-remove]")) {
      const cart = getCart();
      cart.splice(Number(e.target.closest("[data-remove]").dataset.remove), 1);
      saveCart(cart);
    }
    if (e.target.closest("#checkout-btn")) {
      const user = null;
      NovaAuth.getCurrentUser().then((u) => {
        if (!u) {
          window.location.href = "login.html?redirect=index.html";
          return;
        }
        $("#checkout-modal")?.showModal();
        const total = getCart().reduce((s, i) => s + i.price * i.qty, 0);
        const discount = $("#apply-discount")?.checked ? total * 0.15 : 0;
        $("#checkout-total").textContent = formatPrice(total - discount);
      });
    }
    if (e.target.closest("#modal-close")) $("#product-modal")?.close();
    if (e.target.closest("#checkout-close")) $("#checkout-modal")?.close();
  });

  $("#sort-select")?.addEventListener("change", applyFilters);

  $("#search-btn")?.addEventListener("click", () => {
    const bar = $("#search-bar");
    if (bar) {
      bar.hidden = false;
      $("#search-input")?.focus();
    }
  });
  $("#search-close")?.addEventListener("click", () => {
    const bar = $("#search-bar");
    if (bar) bar.hidden = true;
  });

  let searchTimer;
  $("#search-input")?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    searchTimer = setTimeout(async () => {
      const results = $("#search-results");
      if (!q) {
        results.hidden = true;
        return;
      }
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      results.innerHTML = (data.products || [])
        .map((p) => `<li role="option"><button type="button" data-open="${p.id}">${p.name}</button></li>`)
        .join("");
      results.hidden = false;
    }, 200);
  });

  $("#checkout-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const cart = getCart();
    const shipping = {
      email: form.email.value,
      name: form.name.value,
      address: form.address.value,
      city: form.city.value,
      zip: form.zip.value,
    };
    const paymentMethod = form.paymentMethod.value;
    try {
      await NovaAuth.api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart,
          shipping,
          paymentMethod,
          applyDiscount: form.applyDiscount?.checked,
        }),
      });
      localStorage.removeItem(CART_KEY);
      renderCart();
      $("#checkout-modal")?.close();
      showToast("Order placed successfully!");
      openCart(false);
    } catch (err) {
      showToast(err.message);
    }
  });

  $("#apply-discount")?.addEventListener("change", () => {
    const total = getCart().reduce((s, i) => s + i.price * i.qty, 0);
    const discount = $("#apply-discount").checked ? total * 0.15 : 0;
    $("#checkout-total").textContent = formatPrice(total - discount);
  });

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const note = $("#card-note");
      if (note) note.hidden = radio.value !== "card" || !radio.checked;
    });
  });

  $("#newsletter-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#newsletter-email").value;
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      showToast("Subscribed! Use code NOVA15 at checkout.");
    } catch {
      showToast("Could not subscribe. Try again.");
    }
  });

  $("#menu-toggle")?.addEventListener("click", () => {
    const nav = $("#main-nav");
    const btn = $("#menu-toggle");
    const open = nav?.classList.toggle("is-open");
    btn?.setAttribute("aria-expanded", open ? "true" : "false");
  });

  loadProducts();
  renderCart();
  initAuth();
})();
