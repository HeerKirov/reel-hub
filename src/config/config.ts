
export default {
    AUTH: {
        URL: process.env.AUTH_URL,
        CLIENT_ID: process.env.AUTH_CLIENT_ID,
        CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET,
    },
    OSS: {
        ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID,
        ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET,
        BUCKET: process.env.OSS_BUCKET,
        REGION: process.env.OSS_REGION,
        INTERNAL: (process.env.OSS_INTERNAL as string)?.toLowerCase() === "true",
        SECURE: (process.env.OSS_SECURE as string)?.toLowerCase() === "true",
        ENDPOINT: process.env.OSS_ENDPOINT,
        BASE_PATH: process.env.OSS_BASE_PATH || "",
    }
}