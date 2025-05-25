import path from 'path';
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'app/styles')],
    prependData: `@use "variables" as *; @use "mixins" as *;`,
  },
};

export default withPWA(nextConfig);
