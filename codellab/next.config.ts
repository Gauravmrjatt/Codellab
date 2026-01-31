import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  serverExternalPackages: ['vm2'],
};

export default nextConfig;
