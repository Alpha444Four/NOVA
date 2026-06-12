(function () {
  const KEY = "nova-theme";

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll("[data-theme-toggle] button").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function mountToggle(container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn theme-toggle";
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    btn.addEventListener("click", toggleTheme);
    container.appendChild(btn);
    setTheme(getTheme());
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(mountToggle);
})();
