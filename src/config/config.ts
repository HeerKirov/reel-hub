import getConfig from "next/config"

const { publicRuntimeConfig } = getConfig()

export default {
    AUTH: {
        URL: publicRuntimeConfig.AUTH_URL,
        CLIENT_ID: publicRuntimeConfig.AUTH_CLIENT_ID,
        CLIENT_SECRET: publicRuntimeConfig.AUTH_CLIENT_SECRET,
    }
}