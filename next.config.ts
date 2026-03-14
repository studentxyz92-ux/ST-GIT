import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow GitHub API image domains if we ever show repo owner avatars
  images: {
    domains: ["avatars.githubusercontent.com", "github.com"],
  },
};

export default nextConfig;
