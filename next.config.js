const path = require("path");

/**
 * הפניות מאוחדות — סדר חשוב: Next מעריך מהראשון למטה; נתיבים ספציפיים לפני כלליים.
 * יעדים תואמים ל־Workspace under app/app (crm, erp, scan, …).
 */
const LEGACY_REDIRECTS = [
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
  { source: "/dashboard/settings", destination: "/app/settings/overview", permanent: true },
  { source: "/dashboard/crm", destination: "/app/crm", permanent: true },
  { source: "/dashboard/erp", destination: "/app/erp", permanent: true },
  { source: "/dashboard/erp/invoice", destination: "/app/erp", permanent: true },
  { source: "/dashboard/ai", destination: "/app", permanent: true },
  { source: "/dashboard/intelligence", destination: "/app", permanent: true },
  { source: "/dashboard/executive", destination: "/app", permanent: true },
  { source: "/dashboard/operator", destination: "/app", permanent: true },
  { source: "/dashboard/control-center", destination: "/app", permanent: true },
  { source: "/dashboard/business", destination: "/app/business", permanent: true },
  { source: "/dashboard/admin", destination: "/app/admin", permanent: true },
  { source: "/dashboard/help", destination: "/app/settings/overview", permanent: true },
  { source: "/dashboard/meckano", destination: "/app/operations/meckano", permanent: true },
  { source: "/dashboard/attendance", destination: "/app/operations", permanent: true },
  { source: "/dashboard/success", destination: "/app/success", permanent: true },
  { source: "/dashboard/invoices", destination: "/app/erp", permanent: true },
  { source: "/dashboard/trial-expired", destination: "/app/trial-expired", permanent: true },
  { source: "/dashboard/operations", destination: "/app/operations", permanent: true },
  { source: "/dashboard/legacy/ai", destination: "/app", permanent: true },
  { source: "/dashboard/legacy/crm", destination: "/app/crm", permanent: true },
  { source: "/dashboard/legacy/control-center", destination: "/app", permanent: true },
  { source: "/dashboard/legacy/operations", destination: "/app/operations", permanent: true },
  { source: "/dashboard/legacy/settings", destination: "/app/settings/overview", permanent: true },
  { source: "/dashboard/legacy", destination: "/app", permanent: true },
  { source: "/app/billing", destination: "/app/settings/billing", permanent: true },
  { source: "/app/automations", destination: "/app/settings/automations", permanent: true },
  { source: "/app/settings/advanced", destination: "/app/settings/overview", permanent: true },
  { source: "/app/insights", destination: "/app/erp", permanent: true },
  { source: "/app/insights/advanced", destination: "/app/erp", permanent: true },
  { source: "/app/intelligence", destination: "/app", permanent: true },
  { source: "/app/portal", destination: "/app/crm", permanent: true },
  { source: "/app/clients", destination: "/app/crm", permanent: true },
  { source: "/app/clients/:path*", destination: "/app/crm", permanent: true },
  { source: "/app/projects", destination: "/app/crm", permanent: true },
  { source: "/app/projects/:path*", destination: "/app/crm", permanent: true },
  { source: "/app/documents", destination: "/app/erp", permanent: true },
  { source: "/app/documents/:path*", destination: "/app/erp", permanent: true },
  { source: "/app/finance", destination: "/app/erp", permanent: true },
  { source: "/app/finance/:path*", destination: "/app/erp", permanent: true },
  { source: "/app/ai", destination: "/app", permanent: true },
  { source: "/app/inbox", destination: "/app", permanent: true },
  { source: "/app/advanced", destination: "/app", permanent: true },
  { source: "/app/help", destination: "/app/settings/overview", permanent: true },
];

/** מקורות dev מורשים — מרחיב פורטים נפוצים כדי למנוע אזהרות cross-origin ב־next dev */
function buildAllowedDevOrigins() {
  const set = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "127.0.0.1:3000",
    "localhost:3000",
  ]);
  const hosts = ["127.0.0.1", "localhost"];
  const extraPorts = [3001, 3002, 3003, 3004, 3005, 3330, 3331, 3332, 3333, 4173, 5173, 5321];
  for (const h of hosts) {
    for (const p of extraPorts) {
      set.add(`http://${h}:${p}`);
      set.add(`${h}:${p}`);
    }
  }
  return Array.from(set);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: buildAllowedDevOrigins(),
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
          "camera=(), microphone=(self), geolocation=(), interest-cohort=(), browsing-topics=()",
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
    return LEGACY_REDIRECTS;
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
