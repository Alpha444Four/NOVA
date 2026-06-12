(function () {
  const el = document.getElementById("hero-gradient");
  if (!el) return;
  let t = 0;
  function tick() {
    t += 0.003;
    const x = 50 + Math.sin(t) * 20;
    const y = 50 + Math.cos(t * 0.7) * 15;
    el.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(99,102,241,0.35), transparent 55%),
      radial-gradient(circle at ${100 - x}% ${y + 10}%, rgba(236,72,153,0.25), transparent 50%),
      linear-gradient(135deg, var(--hero-from), var(--hero-to))`;
    requestAnimationFrame(tick);
  }
  tick();
})();
