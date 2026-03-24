"use client"

import type { BaseException } from "@/constants/exception"
import type { Result } from "@/schemas/all"
import { toaster } from "@/components/ui/toaster"
import { mapServiceError } from "@/helpers/error"

interface HandleActionResultOption {
    successTitle?: string
    successDescription?: string
}

export function handleActionResult<T, E extends BaseException<string, unknown>>(result: Result<T, E>, option?: HandleActionResultOption): Result<T, E> {
    if(result.ok) {
        if(option?.successTitle || option?.successDescription) {
            toaster.create({
                type: "success",
                title: option.successTitle ?? "操作成功",
                description: option.successDescription
            })
        }
        return result
    }

    const uiError = mapServiceError(result.err)
    toaster.create({
        type: uiError.severity === "error" ? "error" : "warning",
        title: uiError.title,
        description: uiError.description,
        meta: { closable: true }
    })
    return result
}
