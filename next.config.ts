import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/fonts/NotoSans.ttf", "./public/nilds-logo.jpeg"],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" }],
    }];
  },
};
export default nextConfig;
