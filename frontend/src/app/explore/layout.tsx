import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description: "Search every piece in the CurateShelf catalogue by material, maker or mood.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
