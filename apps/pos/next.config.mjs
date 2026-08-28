/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lenzro/supabase", "@lenzro/types"],
  images: { disableStaticImages: true },
  turbopack: {},
};

export default nextConfig;
