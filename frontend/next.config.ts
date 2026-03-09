import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["note-maikon.posthaus.com.br", "note-maikon.local", "localhost:3002"],
    },
  },
};

export default nextConfig;
