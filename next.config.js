const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  async redirects() {
    return [
      {
        source: "/dashboard/executive/subscriptions",
        destination: "/app/billing?tab=control",
        permanent: true,
      },
      {
        source: "/dashboard/executive/manage-subscriptions",
        destination: "/app/billing?tab=control",
        permanent: true,
      },
      { source: "/dashboard", destination: "/app", permanent: true },
      { source: "/dashboard/billing", destination: "/app/billing", permanent: true },
      { source: "/dashboard/settings", destination: "/app/settings", permanent: true },
      { source: "/dashboard/crm", destination: "/app/clients", permanent: true },
      { source: "/dashboard/erp", destination: "/app/documents/erp", permanent: true },
      { source: "/dashboard/erp/invoice", destination: "/app/documents/issue", permanent: true },
      { source: "/dashboard/ai", destination: "/app/insights", permanent: true },
      { source: "/dashboard/intelligence", destination: "/app/intelligence", permanent: true },
      { source: "/dashboard/executive", destination: "/app/intelligence", permanent: true },
      { source: "/dashboard/operator", destination: "/app/intelligence", permanent: true },
      { source: "/dashboard/control-center", destination: "/app/inbox", permanent: true },
      { source: "/dashboard/business", destination: "/app/business", permanent: true },
      { source: "/dashboard/admin", destination: "/app/admin", permanent: true },
      { source: "/dashboard/help", destination: "/app/help", permanent: true },
      { source: "/dashboard/meckano", destination: "/app/operations/meckano", permanent: true },
      { source: "/dashboard/attendance", destination: "/app/operations", permanent: true },
      { source: "/dashboard/success", destination: "/app/success", permanent: true },
      { source: "/dashboard/invoices", destination: "/app/documents/issued", permanent: true },
      { source: "/dashboard/trial-expired", destination: "/app/trial-expired", permanent: true },
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
