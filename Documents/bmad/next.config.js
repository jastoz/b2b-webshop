/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimize for production
  experimental: {
    // optimizeCss: true, // Disabled until critters dependency is resolved
  },
  
  // Image optimization
  images: {
    formats: ['image/webp'],
  },
  
  // Redirect root to customer selection
  async redirects() {
    return [
      {
        source: '/',
        destination: '/customer-select',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;