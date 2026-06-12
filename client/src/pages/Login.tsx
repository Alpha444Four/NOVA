import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { api, type User } from "@/lib/api";

type Props = { onLogin: (user: User) => void };

export function Login({ onLogin }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      onLogin(data.user);
      navigate(data.user.role === "admin" ? "/admin.html" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-[var(--color-nova-border)] bg-[var(--color-nova-surface)] p-8 shadow-sm"
        >
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--color-nova-muted)]">Sign in to your NOVA account</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-[var(--color-nova-border)] bg-transparent px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-[var(--color-nova-border)] bg-transparent px-3 py-2" />
            </label>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-full bg-nova-primary py-2.5 font-semibold text-white hover:bg-nova-primary-hover disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--color-nova-muted)]">
            New here? <Link to="/signup" className="font-semibold text-nova-primary">Create account</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
