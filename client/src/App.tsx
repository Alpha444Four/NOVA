import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { Account } from "@/pages/Account";
import { api, type User } from "@/lib/api";

const CART_KEY = "nova-cart";

function readCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as { qty: number }[];
    return cart.reduce((s, i) => s + i.qty, 0);
  } catch {
    return 0;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
    setCartCount(readCartCount());
    const onStorage = () => setCartCount(readCartCount());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <BrowserRouter>
      <Header user={user} cartCount={cartCount} onLogout={logout} />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/signup" element={<Signup onLogin={setUser} />} />
          <Route path="/account" element={<Account user={user} />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </BrowserRouter>
  );
}
