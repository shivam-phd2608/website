import type { NextConfig } from "next";

// Static export: the whole dashboard builds to plain files in /out,
// which Cloudflare Pages serves for free. Data lives in Supabase.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
