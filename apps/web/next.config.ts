import path from "node:path";

const nextConfig = {
  // Next.js 15 automatically detects src/app
  // No additional configuration needed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Pin Turbopack's workspace root to the monorepo root to avoid incorrect inference
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
} as const;

export default nextConfig;
