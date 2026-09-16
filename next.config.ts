import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/http/security-headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
  async redirects() {
    return [
      { source: "/shop", destination: "/products", permanent: false },
      { source: "/product/:slug", destination: "/products/:slug", permanent: false },
      { source: "/collection/the-builder", destination: "/drop-001", permanent: false },
      { source: "/collection/drop-001", destination: "/drop-001", permanent: false },
    ];
  },
};

export default nextConfig;
