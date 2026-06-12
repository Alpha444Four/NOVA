import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/api";
import { formatPrice } from "@/lib/api";

type Props = {
  product: Product;
  onAdd: (id: number) => void;
};

export function ProductCard({ product, onAdd }: Props) {
  return (
    <motion.article
      layout
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group overflow-hidden rounded-2xl border border-[var(--color-nova-border)] bg-[var(--color-nova-surface)] shadow-sm"
    >
      <div className="aspect-[4/5] overflow-hidden bg-[var(--color-nova-border)]">
        <motion.img
          src={product.image}
          alt=""
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-nova-muted)]">{product.category}</p>
        <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
        <div className="flex items-center justify-between gap-2 pt-1">
          <strong className="text-base">{formatPrice(product.price)}</strong>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onAdd(product.id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-nova-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-nova-primary-hover"
          >
            <ShoppingBag size={14} />
            Add
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
