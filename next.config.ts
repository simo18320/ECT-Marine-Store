import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // TODO(Phase 1 Day 2): replace with the real Supabase project ref once created,
        // e.g. "<project-ref>.supabase.co" — used for product images in Storage.
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
