/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Car listings upload up to 10 photos of 8 MB each.
      bodySizeLimit: "90mb",
    },
  },
};

export default nextConfig;
