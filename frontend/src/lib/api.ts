const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "http://127.0.0.1:8000";

export type AttitudeKind = "love" | "curious" | "skip";

export type Product = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description?: string;
  status: string;
  price: string;
  currency: string;
  compare_at_price: string | null;
  brand: string;
  maker_name: string;
  cover_image: string | null;
  editorial_score: number;
  reading_time_estimate: number;
  published_at: string | null;
  category: { id: number; name: string; slug: string } | null;
  tags: { id: number; name: string; slug: string }[];
  love_count: number;
  curious_count: number;
  skip_count: number;
  my_attitude: AttitudeKind | null;
  inventory_count: number;
  media?: { id: number; file: string; alt_text: string; variants: Record<string, string> }[];
  attributes?: { id: number; key: string; value: string }[];
  sku?: string;
};

export type Profile = {
  email?: string;
  display_name: string;
  username: string;
  bio: string;
  avatar: string | null;
  role: string;
  location: string;
  website: string;
  loves_given: number;
  curious_given: number;
  skips_given?: number;
  notify_replies?: boolean;
  notify_digest?: boolean;
};

export type Comment = {
  id: number;
  body: string;
  parent: number | null;
  author: Profile;
  likes_count: number;
  liked_by_me: boolean;
  replies: Comment[];
  created_at: string;
};

export type Collection = {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover: string | null;
  is_featured: boolean;
  sort_order: number;
  product_count?: number;
  items?: { position: number; blurb: string; product: Product }[];
};

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("cs_access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${MEDIA_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(init.headers || {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  feed: () => request<Product[]>("/products/feed/"),
  products: (q?: string) =>
    request<{ results: Product[] } | Product[]>(
      q ? `/products/?q=${encodeURIComponent(q)}` : "/products/"
    ).then((data) => (Array.isArray(data) ? data : data.results)),
  product: (slug: string) => request<Product>(`/products/${slug}/`),
  categories: () => request<{ id: number; name: string; slug: string }[]>("/categories/"),
  shelves: (featured?: boolean) =>
    request<Collection[]>(featured ? "/shelves/?featured=1" : "/shelves/"),
  shelf: (slug: string) => request<Collection>(`/shelves/${slug}/`),
  register: (body: { email: string; password: string; username?: string }) =>
    request<{ access: string; refresh: string; user: Profile }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string }>("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<Profile>("/me/"),
  updateMe: (body: Partial<Profile>) =>
    request<Profile>("/me/", { method: "PATCH", body: JSON.stringify(body) }),
  profile: (username: string) => request<Profile>(`/users/${username}/`),
  userAttitudes: (username: string, kind?: AttitudeKind) =>
    request<
      | { results: { kind: AttitudeKind; product: Product }[] }
      | { kind: AttitudeKind; product: Product }[]
    >(
      kind
        ? `/users/${username}/attitudes/?kind=${kind}`
        : `/users/${username}/attitudes/`
    ).then((data) => (Array.isArray(data) ? data : data.results)),
  setAttitude: (slug: string, kind: AttitudeKind) =>
    request<{ kind: AttitudeKind; love_count: number; curious_count: number; skip_count: number }>(
      `/products/${slug}/attitude/`,
      { method: "PUT", body: JSON.stringify({ kind }) }
    ),
  clearAttitude: (slug: string) =>
    request<{ kind: null; love_count: number; curious_count: number; skip_count: number }>(
      `/products/${slug}/attitude/`,
      { method: "DELETE" }
    ),
  myAttitudes: (kind?: AttitudeKind) =>
    request<
      | { results: { kind: AttitudeKind; product: Product }[] }
      | { kind: AttitudeKind; product: Product }[]
    >(kind ? `/me/attitudes/?kind=${kind}` : "/me/attitudes/").then((data) =>
      Array.isArray(data) ? data : data.results
    ),
  comments: (slug: string, sort: "newest" | "top" = "newest") =>
    request<{ results: Comment[] } | Comment[]>(`/products/${slug}/comments/?sort=${sort}`).then(
      (data) => (Array.isArray(data) ? data : data.results)
    ),
  postComment: (slug: string, body: string, parent?: number) =>
    request<Comment>(`/products/${slug}/comments/`, {
      method: "POST",
      body: JSON.stringify({ body, parent: parent ?? null }),
    }),
  likeComment: (id: number) =>
    request<{ likes_count: number; liked: boolean }>(`/comments/${id}/like/`, { method: "POST" }),
  unlikeComment: (id: number) =>
    request<{ likes_count: number; liked: boolean }>(`/comments/${id}/like/`, { method: "DELETE" }),
};

export function coverTone(slug: string): { from: string; to: string; accent: string } {
  const tones = [
    { from: "#1c2b28", to: "#0e1614", accent: "#7eb8a8" },
    { from: "#2a241c", to: "#12100c", accent: "#d4a574" },
    { from: "#1a2433", to: "#0c121a", accent: "#8aafd4" },
    { from: "#2b1e24", to: "#140e11", accent: "#c98b9a" },
    { from: "#1e2a1a", to: "#0f150c", accent: "#a8c07a" },
    { from: "#241f2e", to: "#110e16", accent: "#9b8ec4" },
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[hash];
}