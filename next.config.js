const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "127.0.0.1:3000",
    "localhost:3000",
  ],
  /** כותרות אבטחה ופרטיות (תאימות מומלצת לאיחוד האירופי / מצב best-practice) */
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
      },
    ];
    if (isProd) {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers: security,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/executive/subscriptions",
        destination: "/app/settings/billing?tab=control",
        permanent: true,
      },
      {
        source: "/dashboard/executive/manage-subscriptions",
        destination: "/app/settings/billing?tab=control",
        permanent: true,
      },
      { source: "/dashboard", destination: "/app", permanent: true },
      { source: "/dashboard/billing", destination: "/app/settings/billing", permanent: true },
      { source: "/dashboard/settings", destination: "/app/settings", permanent: true },
      { source: "/dashboard/crm", destination: "/app/clients", permanent: true },
      { source: "/dashboard/erp", destination: "/app/documents/erp", permanent: true },
      { source: "/dashboard/erp/invoice", destination: "/app/documents/issue", permanent: true },
      { source: "/dashboard/ai", destination: "/app/ai", permanent: true },
      { source: "/dashboard/intelligence", destination: "/app/ai", permanent: true },
      { source: "/dashboard/executive", destination: "/app/ai", permanent: true },
      { source: "/dashboard/operator", destination: "/app/ai", permanent: true },
      { source: "/dashboard/control-center", destination: "/app/inbox", permanent: true },
      { source: "/dashboard/business", destination: "/app/business", permanent: true },
      { source: "/dashboard/admin", destination: "/app/admin", permanent: true },
      { source: "/dashboard/help", destination: "/app/help", permanent: true },
      { source: "/dashboard/meckano", destination: "/app/operations/meckano", permanent: true },
      { source: "/dashboard/attendance", destination: "/app/operations", permanent: true },
      { source: "/dashboard/success", destination: "/app/success", permanent: true },
      { source: "/dashboard/invoices", destination: "/app/documents/issued", permanent: true },
      { source: "/dashboard/trial-expired", destination: "/app/trial-expired", permanent: true },
      { source: "/dashboard/operations", destination: "/app/operations", permanent: true },
      { source: "/dashboard/legacy/ai", destination: "/app/ai", permanent: true },
      { source: "/dashboard/legacy/crm", destination: "/app/clients", permanent: true },
      { source: "/dashboard/legacy/control-center", destination: "/app/inbox", permanent: true },
      { source: "/dashboard/legacy/operations", destination: "/app/operations", permanent: true },
      { source: "/dashboard/legacy/settings", destination: "/app/settings", permanent: true },
      { source: "/dashboard/legacy", destination: "/app", permanent: true },
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
