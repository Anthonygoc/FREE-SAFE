import type { NextConfig } from 'next';

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseRemotePattern = supabaseUrl
  ? (() => {
      const url = new URL(supabaseUrl);
      return {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port,
        pathname: '/storage/v1/object/public/**',
      };
    })()
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseRemotePattern ? [supabaseRemotePattern] : [],
  },
};

export default nextConfig;
