import { FadeIn } from "@/components/motion/FadeIn";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--color-nova-border)] bg-[var(--color-nova-surface)]">
      <FadeIn className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">NOVA</p>
          <p className="mt-2 text-sm text-[var(--color-nova-muted)]">Premium lifestyle essentials, thoughtfully curated.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-nova-muted)]">
            <li><a href="#shop">All products</a></li>
            <li><a href="/help.html">Help & returns</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Account</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-nova-muted)]">
            <li><a href="/login">Log in</a></li>
            <li><a href="/admin.html">Admin</a></li>
          </ul>
        </div>
      </FadeIn>
      <p className="border-t border-[var(--color-nova-border)] py-4 text-center text-xs text-[var(--color-nova-muted)]">
        © {new Date().getFullYear()} NOVA Store
      </p>
    </footer>
  );
}
