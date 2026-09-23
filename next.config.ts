import type { NextConfig } from "next";

const publicBase = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: publicBase,
  assetPrefix: publicBase || undefined,
};

export default nextConfig;
