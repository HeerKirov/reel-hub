import OSS from "ali-oss"
import config from "@/config/config"

const client = new OSS({
    accessKeyId: config.OSS.ACCESS_KEY_ID || "",
    accessKeySecret: config.OSS.ACCESS_KEY_SECRET || "",
    bucket: config.OSS.BUCKET,
    region: config.OSS.REGION,
    internal: config.OSS.INTERNAL,
    secure: config.OSS.SECURE,
    endpoint: config.OSS.ENDPOINT
})

export async function uploadFile(objectName: string, file: Buffer | string, options?: OSS.PutObjectOptions): Promise<OSS.PutObjectResult> {
    try {
        return await client.put(`${config.OSS.BASE_PATH}/${objectName}`, file, options)
    } catch (error) {
        console.error("Error uploading file to OSS:", error)
        throw error
    }
}

export async function existFile(objectName: string): Promise<boolean> {
    try {
        await client.head(`${config.OSS.BASE_PATH}/${objectName}`)
        return true
    } catch (error) {
        return false
    }
}

export async function deleteFile(objectName: string): Promise<void> {
    try {
        await client.delete(`${config.OSS.BASE_PATH}/${objectName}`)
    } catch (error) {
        console.error("Error deleting file from OSS:", error)
        throw error
    }
}

export async function getSignedUrl(objectName: string, expireTime: number = 3600): Promise<string> {
    try {
        return client.signatureUrl(`${config.OSS.BASE_PATH}/${objectName}`, {expires: expireTime})
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

    const credentials = client.calculatePostSignature(policy)

    return {
        ...credentials,
        dir: config.OSS.BASE_PATH + "/" + (options?.dir ? `${options.dir}/` : "/"),
        filename: options?.filename,
        host: `https://${config.OSS.BUCKET}.${config.OSS.REGION}.aliyuncs.com`
    }
}