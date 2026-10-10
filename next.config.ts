import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The browser only talks to this Next.js origin; /api/* is proxied to the Express API.
  // This keeps the session cookie first-party (no CORS, no third-party-cookie problems).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
