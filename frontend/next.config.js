/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost', port: '8000' },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
