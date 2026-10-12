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
  /** Up to two card-sized gallery shots (excludes the cover). Present on list/feed payloads. */
  gallery_preview?: { url: string; alt: string }[];
  media?: { id: number; file: string; alt_text: string; sort_order?: number; variants: Record<string, string> }[];
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
  /** Published catalogue; `q` is Postgres full-text search, `category` a category slug. */
  products: (filters: { q?: string; category?: string } = {}) => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (filters.category) qs.set("category", filters.category);
    const query = qs.toString();
    return request<{ results: Product[] } | Product[]>(`/products/${query ? `?${query}` : ""}`).then(
      (data) => (Array.isArray(data) ? data : data.results)
    );
  },
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

export type ImageRef = { src: string; alt: string };

/**
 * Every photo we know for a product, cover first, deduplicated.
 * Detail payloads carry `media` (hero variants); list payloads carry `gallery_preview`.
 */
export function productImages(p: Product): ImageRef[] {
  const out: ImageRef[] = [];
  const seen = new Set<string>();
  const push = (src: string | null | undefined, alt: string) => {
    const url = mediaUrl(src);
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push({ src: url, alt });
    }
  };
  if (p.media?.length) {
    for (const m of p.media) push(m.variants?.hero || m.file, m.alt_text || p.title);
  } else {
    push(p.cover_image, p.title);
    for (const g of p.gallery_preview ?? []) push(g.url, g.alt || p.title);
  }
  if (!out.length) push(p.cover_image, p.title);
  return out;
}

/** "Maker · Brand", collapsing the brand when the maker name already contains it. */
export function byline(p: Pick<Product, "maker_name" | "brand">, joiner = " · "): string {
  const maker = p.maker_name?.trim() ?? "";
  const brand = p.brand?.trim() ?? "";
  if (!maker) return brand;
  if (!brand || maker.toLowerCase().includes(brand.toLowerCase())) return maker;
  return `${maker}${joiner}${brand}`;
}

export function formatPrice(p: Pick<Product, "price" | "currency">): string {
  const n = Number(p.price);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: p.currency || "USD",
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `${p.currency} ${p.price}`;
  }
}

/** Placeholder tone shown behind a photo while it loads (and if it is missing). */
export function coverTone(slug: string): { from: string; to: string; accent: string } {
  // Muted, warm mid-tones drawn from the paper/clay/sage palette, so the placeholder
  // reads as "photo loading" on paper pages rather than a dark block.
  const tones = [
    { from: "#ddd5c8", to: "#cfc5b5", accent: "#8fa89a" },
    { from: "#e2d6c6", to: "#d0bfa9", accent: "#b4846c" },
    { from: "#d6d8cf", to: "#c3c8bb", accent: "#8fa89a" },
    { from: "#e0d3cc", to: "#cdbab0", accent: "#b4846c" },
    { from: "#d9d3c4", to: "#c7bfac", accent: "#a39a7e" },
    { from: "#d7d2cc", to: "#c4bdb5", accent: "#8e8579" },
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[hash];
}