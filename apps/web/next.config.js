import path from 'path';


const nextConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'app/styles')],  // Adjust path to match your styles folder
    prependData: `@use "variables" as *; @use "mixins" as *;`,  // Add the path and alias to the global variables
  },
};

export default nextConfig;
