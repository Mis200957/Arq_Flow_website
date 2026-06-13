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
};

export default nextConfig;
