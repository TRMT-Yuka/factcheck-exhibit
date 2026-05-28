import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig | ((phase: string) => import('next').NextConfig)} */
const nextConfig = (phase) => ({
  typedRoutes: true,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'
});

export default nextConfig;
