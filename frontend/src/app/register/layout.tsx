import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join",
  description: "Create a CurateShelf account to keep the pieces you love.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
