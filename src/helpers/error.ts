import type { BaseException } from "@/constants/exception"

export type UiErrorSeverity = "error" | "warning" | "info"

export interface UiError {
    code: string
    title: string
    description: string
    severity: UiErrorSeverity
    retryable: boolean
}

type ExceptionInfo = {
    resourceName?: string
    resourceValue?: string | number
}

function parseExceptionInfo(info: unknown): ExceptionInfo {
    if(typeof info !== "object" || info === null) return {}
    const value = info as Record<string, unknown>
    const resourceName = typeof value.resourceName === "string" ? value.resourceName : undefined
    const resourceValue = typeof value.resourceValue === "string" || typeof value.resourceValue === "number" ? value.resourceValue : undefined
    return { resourceName, resourceValue }
}

export function mapServiceError(error: BaseException<string, unknown>): UiError {
    const info = parseExceptionInfo(error.info)
    switch(error.code) {
        case "PARAM_ERROR":
        case "PARAM_TYPE_ERROR":
        case "PARAM_REQUIRED":
        case "PARAM_NOT_REQUIRED":
            return {
                code: error.code,
                title: "参数有误",
                description: error.message || "请检查输入内容",
                severity: "warning",
                retryable: true
            }
        case "NOT_EXIST": {
            const resourceName = info.resourceName ?? "resource"
            const resourceValue = info.resourceValue
            return {
                code: error.code,
                title: "目标不存在",
                description: resourceValue !== undefined ? `${resourceName}: ${resourceValue} 不存在` : error.message,
                severity: "error",
                retryable: true
            }
        }
        case "NOT_SUITABLE":
            return {
                code: error.code,
                title: "当前状态不支持该操作",
                description: error.message,
                severity: "warning",
                retryable: true
            }
        case "ALREADY_EXISTS":
            return {
                code: error.code,
                title: "数据已存在",
                description: error.message,
                severity: "info",
                retryable: false
            }
        case "UNAUTHORIZED":
            return {
                code: error.code,
                title: "未登录",
                description: "请在登录后访问该内容",
                severity: "error",
                retryable: false
            }
        case "FORBIDDEN":
            return {
                code: error.code,
                title: "禁止访问",
                description: "您没有权限访问该内容",
                severity: "error",
                retryable: false
            }
        default:
            return {
                code: error.code,
                title: "操作失败",
                description: error.message || "服务器发生未知错误，请稍后再试",
                severity: "error",
                retryable: true
            }
    }
}
