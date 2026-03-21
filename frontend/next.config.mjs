/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 14+

  webpack(config, { dev }) {
    if (dev) {
      // Avoid persisting stale webpack chunks when using the fallback dev server.
      config.cache = false;
    }

    return config;
  },
  
  async rewrites() {
    return {
      // These rewrites are checked before headers/redirects and before all files
      beforeFiles: [
        // Proxy all subdomain traffic to the Render backend (router)
        // This matches any subdomain except www and the main domain
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              // Match any subdomain like project.sharelive.site but NOT www or naked domain
              value: '(?<subdomain>(?!www)[a-zA-Z0-9-]+)\\.sharelive\\.site',
            },
          ],
          // Pass the original host as x-forwarded-host header
          destination: 'https://share-live.onrender.com/:path*',
        },
      ],
    };
  },

  // Pass the original host header to the backend
  async headers() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>(?!www)[a-zA-Z0-9-]+)\\.sharelive\\.site',
          },
        ],
        headers: [
          {
            key: 'x-original-host',
            value: ':subdomain.sharelive.site',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
