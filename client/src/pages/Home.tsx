import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { api, type Product } from "@/lib/api";

const CART_KEY = "nova-cart";

type CartItem = { productId: number; name: string; price: number; qty: number };

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    api<{ products: Product[] }>("/api/products")
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]));
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    } catch {
      setCart([]);
    }
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products]
  );

  const filtered = category ? products.filter((p) => p.category === category) : products;
  const featured = products.filter((p) => p.featured).slice(0, 4);

  function addToCart(id: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setCart((prev) => {
      const next = [...prev];
      const existing = next.find((i) => i.productId === id);
      if (existing) existing.qty += 1;
      else next.push({ productId: id, name: product.name, price: product.price, qty: 1 });
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pt-20">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, #eef2ff, transparent 50%), radial-gradient(circle at 80% 0%, #fdf2f8, transparent 45%)",
              "radial-gradient(circle at 80% 20%, #eef2ff, transparent 50%), radial-gradient(circle at 10% 80%, #fdf2f8, transparent 45%)",
              "radial-gradient(circle at 20% 20%, #eef2ff, transparent 50%), radial-gradient(circle at 80% 0%, #fdf2f8, transparent 45%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-nova-primary"
            >
              <span className="rounded-full bg-nova-primary/10 px-2 py-0.5 text-xs">New</span>
              Spring Collection 2026
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl font-bold leading-tight md:text-5xl"
            >
              Curated essentials for <em className="not-italic text-nova-primary">modern living</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55 }}
              className="mt-4 max-w-lg text-[var(--color-nova-muted)]"
            >
              Premium fashion, tech, and home goods — ethically sourced, designed to last.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a href="#shop" className="rounded-full bg-nova-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-nova-primary-hover">
                Shop the collection
              </a>
              <a href="#featured" className="rounded-full border border-[var(--color-nova-border)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--color-nova-surface)]">
                View bestsellers
              </a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3"
          >
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                animate={{ y: [0, i % 2 ? -8 : 8, 0] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                className="overflow-hidden rounded-2xl border border-[var(--color-nova-border)] bg-[var(--color-nova-surface)] shadow-sm"
              >
                <img src={p.image} alt="" className="aspect-square w-full object-cover" />
              </motion.div>
            ))}
          </motion.div>
        </div>
        <p className="sr-only" aria-live="polite">{cartCount} items in cart</p>
      </section>

      <section id="featured" className="mx-auto max-w-6xl px-4 py-10">
        <FadeIn>
          <h2 className="font-display text-2xl font-bold">Featured picks</h2>
        </FadeIn>
        <StaggerContainer className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} onAdd={addToCart} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <section id="shop" className="mx-auto max-w-6xl px-4 py-10">
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Shop all</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!category ? "bg-nova-primary text-white" : "border border-[var(--color-nova-border)]"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${category === c ? "bg-nova-primary text-white" : "border border-[var(--color-nova-border)]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </FadeIn>
        <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </motion.div>
      </section>
    </main>
  );
}
