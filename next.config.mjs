/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
          { source: '/services', destination: '/spa', permanent: true }, // 老 -> 新
        ];
      },
};
export default nextConfig;
