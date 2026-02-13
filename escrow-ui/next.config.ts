import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    "/api/engine/transactions/[id]/execution-plan.pdf": ["./assets/fonts/*.ttf"],
  },
};

export default nextConfig;
