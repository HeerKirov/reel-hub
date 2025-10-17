import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: "standalone",
    publicRuntimeConfig: {
        AUTH_URL: process.env.AUTH_URL,
        AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID,
        AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET,
        OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID,
        OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET,
        OSS_BUCKET: process.env.OSS_BUCKET,
        OSS_REGION: process.env.OSS_REGION,
        OSS_INTERNAL: process.env.OSS_INTERNAL,
        OSS_SECURE: process.env.OSS_SECURE,
        OSS_ENDPOINT: process.env.OSS_ENDPOINT,
        OSS_BASE_PATH: process.env.OSS_BASE_PATH,
    }
};

export default nextConfig;
