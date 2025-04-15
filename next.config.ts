/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint hatalarında build'in başarısız olmasını önler
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript hatalarında build'in başarısız olmasını önler
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
