import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { User } from "@/lib/api";

type Props = {
  user: User | null;
  cartCount: number;
  onLogout: () => void;
};

export function Header({ user, cartCount, onLogout }: Props) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-[var(--color-nova-border)] bg-[color-mix(in_srgb,var(--color-nova-bg)_85%,transparent)] backdrop-blur-xl"
    >
      <div className="mx-auto flex min-h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-nova-primary text-white">N</span>
          NOVA
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <a href="#shop" className="text-sm font-semibold text-[var(--color-nova-muted)] hover:text-[var(--color-nova-text)]">Shop</a>
          <a href="#featured" className="text-sm font-semibold text-[var(--color-nova-muted)] hover:text-[var(--color-nova-text)]">Featured</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/account" className="text-sm font-semibold hover:underline">{user.name.split(" ")[0]}</Link>
              <button type="button" onClick={onLogout} className="text-sm text-[var(--color-nova-muted)] hover:text-[var(--color-nova-text)]">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-nova-border)]">Log in</Link>
              <Link to="/signup" className="rounded-full bg-nova-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-nova-primary-hover">Sign up</Link>
            </>
          )}
          <motion.span
            key={cartCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="relative inline-flex"
            aria-label={`${cartCount} items in cart`}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid min-w-[18px] place-items-center rounded-full bg-nova-primary px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </motion.span>
        </div>
      </div>
    </motion.header>
  );
}
