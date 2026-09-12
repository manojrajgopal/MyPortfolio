import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Static export.
   *
   * The site has no API routes, no dynamic segments and no server-side data
   * fetching — every page is prerendered — so it ships as plain HTML, CSS and
   * JS that any static host can serve. `next build` writes the result to
   * `out/`, which is the directory Render publishes.
   */
  output: 'export',

  /**
   * Emit `contact/index.html` rather than `contact.html`.
   *
   * Static hosts resolve a directory index reliably; extensionless files are
   * handled inconsistently between them. This costs a trailing slash in the
   * URL and removes a whole class of 404s on deploy.
   */
  trailingSlash: true,

  /**
   * The export target has no image optimisation server. Nothing here uses
   * `next/image` today, but this keeps the build from failing if something
   * does later.
   */
  images: { unoptimized: true },

  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
};

export default nextConfig;
