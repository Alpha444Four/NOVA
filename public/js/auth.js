const NovaAuth = (() => {
  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function ensureServer() {
    try {
      const health = await api("/api/health");
      return Boolean(health.ok);
    } catch {
      return false;
    }
  }

  async function getCurrentUser() {
    try {
      const data = await api("/api/auth/me");
      return data.user;
    } catch {
      return null;
    }
  }

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return data.user;
  }

  async function register(name, email, password) {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    return data.user;
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
  }

  function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || params.get("from");
    if (redirect) return redirect;
    return "index.html";
  }

  async function finishAuthAndRedirect() {
    const user = await getCurrentUser();
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || params.get("from");
    if (user?.role === "admin" && (redirect || "").includes("admin")) {
      window.location.href = "admin.html";
      return;
    }
    if (user?.role === "admin" && !redirect) {
      window.location.href = "admin.html";
      return;
    }
    window.location.href = redirect || "index.html";
  }

  function showAuthError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function hideAuthError(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = "";
  }

  function renderUserMenu(user, slot) {
    if (!slot) return;
    if (!user) {
      slot.innerHTML =
        '<a href="login.html" class="btn btn--ghost btn--sm">Log in</a><a href="signup.html" class="btn btn--primary btn--sm">Sign up</a>';
      return;
    }
    slot.innerHTML = `<div class="user-menu">
      <a href="account.html" class="user-menu__link">${user.name.split(" ")[0]}</a>
      <button type="button" class="btn btn--ghost btn--sm" id="logout-btn">Sign out</button>
    </div>`;
    slot.querySelector("#logout-btn")?.addEventListener("click", async () => {
      await logout();
      window.location.reload();
    });
  }

  return {
    api,
    ensureServer,
    getCurrentUser,
    login,
    register,
    logout,
    getRedirectUrl,
    finishAuthAndRedirect,
    showAuthError,
    hideAuthError,
    renderUserMenu,
  };
})();
