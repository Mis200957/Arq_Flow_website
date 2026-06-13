import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Force CJS builds for packages that ship both ESM (.mjs) and CJS (.cjs)
  // Next.js/webpack picks .mjs via the "import" condition but then can't
  // resolve bare-specifier peer deps inside those ESM bundles.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force CJS entry for supabase-js (avoids .mjs → bare-import resolution failures)
      "@supabase/supabase-js": path.resolve(
        "./node_modules/@supabase/supabase-js/dist/index.cjs"
      ),
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "zjathejcdkpxjyvululp.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
