const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  async redirects() {
    return [
      {
        source: "/dashboard/executive/subscriptions",
        destination: "/dashboard/billing?tab=control",
        permanent: true,
      },
      {
        source: "/dashboard/executive/manage-subscriptions",
        destination: "/dashboard/billing?tab=control",
        permanent: true,
      },
    ];
  },
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
