import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Externalize better-sqlite3 so it's not bundled by webpack
    // (it's a native Node.js addon that must be require()'d at runtime)
    serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
