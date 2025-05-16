import { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/AmeyKuradeAK/nuvante-cdn/**',
      },
    ],
  },
}

export default config
