import getConfig from "next/config"

const { publicRuntimeConfig } = getConfig()

export default {
    AUTH: {
        URL: publicRuntimeConfig.AUTH_URL,
        CLIENT_ID: publicRuntimeConfig.AUTH_CLIENT_ID,
        CLIENT_SECRET: publicRuntimeConfig.AUTH_CLIENT_SECRET,
    },
    OSS: {
        ACCESS_KEY_ID: publicRuntimeConfig.OSS_ACCESS_KEY_ID,
        ACCESS_KEY_SECRET: publicRuntimeConfig.OSS_ACCESS_KEY_SECRET,
        BUCKET: publicRuntimeConfig.OSS_BUCKET,
        REGION: publicRuntimeConfig.OSS_REGION,
        INTERNAL: (publicRuntimeConfig.OSS_INTERNAL as string)?.toLowerCase() === "true",
        SECURE: (publicRuntimeConfig.OSS_SECURE as string)?.toLowerCase() === "true",
        ENDPOINT: publicRuntimeConfig.OSS_ENDPOINT,
        BASE_PATH: publicRuntimeConfig.OSS_BASE_PATH || "",
    }
}