/**
 * Next.js 設定。
 *
 * 子路徑部署：把 BASE_PATH 設成例如 "/original-face"，app 會以該子路徑為根。
 * 子域名或單獨 domain：不設，或設成空字串即可。
 *
 * 例：
 *   BASE_PATH=/original-face npm run build
 */
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  // assetPrefix 讓 CDN 上的 /_next/* 資源也走同一個子路徑
  assetPrefix: basePath || undefined,
  // 把 basePath 注入前端，讓 fetch / <Link> 等前端程式碼知道要加前綴
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
