import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // workspace package ships TypeScript sources; Next must compile them
  transpilePackages: ["@rangerai/shared"],
};

export default nextConfig;
