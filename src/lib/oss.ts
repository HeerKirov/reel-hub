import OSS from "ali-oss"
import config from "@/config/config"

let client: OSS | null = null

/** 构建期 import 本模块时不实例化 OSS；仅在运行时首次调用 API 时创建，避免 yarn build 缺少 .env 即报错 */
function getOssClient(): OSS {
    if (client) return client
    const { ACCESS_KEY_ID, ACCESS_KEY_SECRET, BUCKET, REGION, INTERNAL, SECURE, ENDPOINT } = config.OSS
    if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !BUCKET || !REGION) {
        throw new Error("OSS 配置不完整：需要 OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET、OSS_REGION")
    }
    client = new OSS({
        accessKeyId: ACCESS_KEY_ID,
        accessKeySecret: ACCESS_KEY_SECRET,
        bucket: BUCKET,
        region: REGION,
        internal: INTERNAL,
        secure: SECURE,
        endpoint: ENDPOINT
    })
    return client
}

export async function uploadFile(objectName: string, file: Buffer | string, options?: OSS.PutObjectOptions): Promise<OSS.PutObjectResult> {
    try {
        return await getOssClient().put(`${config.OSS.BASE_PATH}/${objectName}`, file, options)
    } catch (error) {
        console.error("Error uploading file to OSS:", error)
        throw error
    }
}

export async function existFile(objectName: string): Promise<boolean> {
    try {
        await getOssClient().head(`${config.OSS.BASE_PATH}/${objectName}`)
        return true
    } catch (error) {
        return false
    }
}

export async function deleteFile(objectName: string): Promise<void> {
    try {
        await getOssClient().delete(`${config.OSS.BASE_PATH}/${objectName}`)
    } catch (error) {
        console.error("Error deleting file from OSS:", error)
        throw error
    }
}

export async function getSignedUrl(objectName: string, expireTime: number = 3600): Promise<string> {
    try {
        return getOssClient().signatureUrl(`${config.OSS.BASE_PATH}/${objectName}`, {expires: expireTime})
    } catch (error) {
        console.error("Error generating signed URL:", error)
        throw error
    }
}

export async function getUploadCredentical(options?: { dir?: string, filename?: string, contentLength?: number, contentType?: string, expireMilli?: number }): Promise<OSS.PostObjectParams & { dir: string, filename: string | undefined, host: string }> {
    const contentTypePolicy = options?.contentType?.includes("/") ? ["eq", "$Content-Type", options.contentType] : options?.contentType ? ["starts-with", "$Content-Type", `${options.contentType}/`] : undefined
    const contentLengthPolicy = ["content-length-range", 0, options?.contentLength ?? 1024 * 1024 * 10] //限制上传大小，默认10MB
    const keyPolicy = ["starts-with", "$key", config.OSS.BASE_PATH + "/" + (options?.dir ? `${options.dir}/` : "/") + (options?.filename ?? "")]
    const expiration = new Date(Date.now() + (options?.expireMilli ?? 1000 * 60 * 60)).toISOString() //有效时长，默认10min

    const policy = {
        expiration,
        conditions: [
            contentLengthPolicy,
            contentTypePolicy,
            keyPolicy,
            ["eq", "$x-oss-forbid-overwrite", "true"],
            { bucket: config.OSS.BUCKET }
        ]
    }

    const credentials = getOssClient().calculatePostSignature(policy)

    return {
        ...credentials,
        dir: config.OSS.BASE_PATH + "/" + (options?.dir ? `${options.dir}/` : "/"),
        filename: options?.filename,
        host: `https://${config.OSS.BUCKET}.${config.OSS.REGION}.aliyuncs.com`
    }
}