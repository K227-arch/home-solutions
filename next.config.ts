import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses the correct project root
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
