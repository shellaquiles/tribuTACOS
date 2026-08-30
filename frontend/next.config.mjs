/** @type {import('next').NextConfig} */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFile = path.join(__dirname, '..', 'VERSION');
const versionFileLocal = path.join(__dirname, 'VERSION');
const versionPath = [versionFile, versionFileLocal].find((candidate) =>
  fs.existsSync(candidate)
);
const appVersion = versionPath
  ? fs.readFileSync(versionPath, 'utf8').trim()
  : '0.0.0';

const isStandalone = process.env.BUILD_MODE === 'standalone';
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8010';

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  ...(isStandalone ? { output: 'export' } : {}),
  async rewrites() {
    if (isStandalone) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
