import type { NextConfig } from "next";

function getSupabaseImageHostname() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) return "beyzubmbwygxiixuieiy.supabase.co";

  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "beyzubmbwygxiixuieiy.supabase.co";
  }
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DEV_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseImageHostname(),
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
