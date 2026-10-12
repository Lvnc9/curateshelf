import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Edit how you appear to other readers.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
