function initAuthPage(formId, errorId) {
  const form = document.getElementById(formId);
  const errorEl = document.getElementById(errorId);

  document.querySelectorAll("[data-password-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.getAttribute("aria-controls"));
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.querySelector(".icon-show").hidden = show;
      btn.querySelector(".icon-hide").hidden = !show;
    });
  });

  return { form, errorEl };
}

function setAuthLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}
