/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
