/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-signature-canvas", "signature_pad"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
