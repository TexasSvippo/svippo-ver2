import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['next-sanity'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // 85 is used for the home page and blog card photos (AVIF is encoded at quality - 20).
    qualities: [75, 85],
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
