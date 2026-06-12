const jsonHeaders = { "Content-Type": "application/json" };

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { ...jsonHeaders, ...(options.headers as Record<string, string>) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  featured: number;
  stock: number;
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
