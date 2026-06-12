/**
 * Motion-powered UI animations for the vanilla storefront.
 * Uses the Motion library (same team as Framer Motion) via ESM CDN.
 */
import { animate, stagger, inView } from "https://cdn.jsdelivr.net/npm/motion@11.15.0/+esm";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  inView(".hero__content > *", (el) => {
    animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.55, delay: stagger(0.08), easing: [0.22, 1, 0.36, 1] });
  });

  inView(".product-card, .featured-card", (el) => {
    animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.5, easing: [0.22, 1, 0.36, 1] });
  });

  inView(".section-header, .about__grid > *, .footer__grid > *", (el) => {
    animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, easing: "ease-out" });
  });

  const header = document.getElementById("header-shell");
  if (header) {
    animate(header, { opacity: [0, 1], y: [-12, 0] }, { duration: 0.4, easing: "ease-out" });
  }

  document.querySelectorAll(".btn--primary").forEach((btn) => {
    btn.addEventListener("mouseenter", () => animate(btn, { scale: 1.03 }, { duration: 0.2 }));
    btn.addEventListener("mouseleave", () => animate(btn, { scale: 1 }, { duration: 0.2 }));
  });

  const toast = document.getElementById("toast");
  if (toast) {
    const observer = new MutationObserver(() => {
      if (toast.classList.contains("is-visible")) {
        animate(toast, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3 });
      }
    });
    observer.observe(toast, { attributes: true, attributeFilter: ["class"] });
  }
}
