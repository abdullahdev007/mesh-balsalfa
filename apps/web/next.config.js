import path from 'path';
import nextPWA from 'next-pwa';
import { source } from 'framer-motion/client';

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // disables PWA in development mode
});

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'app/styles')],
    prependData: `@use "variables" as *; @use "mixins" as *;`,
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ]
      }
    ]
  }
};

export default withPWA(nextConfig);
