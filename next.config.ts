import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/docs", destination: "/docs/introduction", permanent: false },
    { source: "/examples", destination: "/examples/basic-menu", permanent: false },
  ],
};

export default nextConfig;
