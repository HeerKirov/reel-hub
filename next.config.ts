import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: "standalone",
    publicRuntimeConfig: {
        AUTH_URL: process.env.AUTH_URL,
        AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID,
        AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET,
    }
};

export default nextConfig;
