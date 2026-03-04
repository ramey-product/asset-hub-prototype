import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Set basePath for GitHub Pages — repo name will be the subpath
  // Update this if your repo name differs from "asset-hub-prototype"
  basePath: process.env.NODE_ENV === "production" ? "/asset-hub-prototype" : "",
};

export default nextConfig;
