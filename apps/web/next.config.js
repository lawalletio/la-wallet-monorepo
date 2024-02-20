/** @type {import('next').NextConfig} */

// const withPWA = require('@ducanh2912/next-pwa').default({
//   dest: 'public',
//   skipWaiting: true,
//   register: true
// })

const withSerwist = require('@serwist/next').default({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: 'src/utils/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  swcMinify: true,
  transpilePackages: ['@lawallet/react', '@lawallet/utils', '@lawallet/ui'],
  compiler: {
    styledComponents: true,
  },
};

module.exports = withSerwist(nextConfig);
