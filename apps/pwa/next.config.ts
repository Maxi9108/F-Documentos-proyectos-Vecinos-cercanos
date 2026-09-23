import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.lhr.life",
    "*.loca.lt",
    "localhost",
    "127.0.0.1",
    "192.168.*",
  ],
};

export default nextConfig;
