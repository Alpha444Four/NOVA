import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { api, formatPrice, type User } from "@/lib/api";

type Order = {
  id: number;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingName: string;
  shippingCity: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
};

type Props = { user: User | null };

export function Account({ user }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    api<{ orders: Order[] }>("/api/orders")
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <FadeIn>
          <h1 className="font-display text-3xl font-bold">Your account</h1>
          <p className="mt-1 text-[var(--color-nova-muted)]">{user.name} · {user.email}</p>
        </FadeIn>
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="text-[var(--color-nova-muted)]">No orders yet.</p>
          ) : (
            orders.map((o, i) => (
              <motion.article
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-[var(--color-nova-border)] bg-[var(--color-nova-surface)] p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Order #{o.id}</p>
                    <p className="text-sm text-[var(--color-nova-muted)]">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(o.total)}</p>
                </div>
                <p className="mt-2 text-sm capitalize text-[var(--color-nova-muted)]">{o.orderStatus} · {o.paymentMethod}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((item) => (
                    <li key={item.name}>{item.qty}× {item.name}</li>
                  ))}
                </ul>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
