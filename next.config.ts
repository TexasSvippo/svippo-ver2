import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['next-sanity'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'axntwrozzmivlmjrgpra.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
};

export default nextConfig;
