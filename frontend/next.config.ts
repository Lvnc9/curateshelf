import type { NextConfig } from "next";

// Product photos are served by Django from MEDIA_URL. Allow next/image to optimize them.
const mediaOrigin = new URL(process.env.NEXT_PUBLIC_MEDIA_URL || "http://127.0.0.1:8000");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: mediaOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: mediaOrigin.hostname,
        port: mediaOrigin.port,
        pathname: "/media/**",
      },
      // localhost and 127.0.0.1 are used interchangeably in local dev
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
