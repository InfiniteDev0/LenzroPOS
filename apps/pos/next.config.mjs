import { withSerwist } from "@serwist/turbopack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lenzro/supabase", "@lenzro/types"],
  images: { disableStaticImages: true },
  turbopack: {},
};

export default withSerwist(nextConfig);
