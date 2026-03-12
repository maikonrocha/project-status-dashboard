import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3002", "ti-maikonr.posthaus.com.br:3002"],
    },
  },
};

export default nextConfig;
