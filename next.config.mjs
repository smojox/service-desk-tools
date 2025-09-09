/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure proper routing on Vercel
  trailingSlash: false,
  // Force static export for better compatibility
  output: 'standalone',
}

export default nextConfig
