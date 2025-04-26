import path from 'path';

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'app/styles')],
    prependData: `@use "variables" as *; @use "mixins" as *;`,
  },
};

export default nextConfig;
