import type { BaseException } from "@/constants/exception"
import type { Result } from "@/schemas/all"
import { mapServiceError, UiError } from "@/helpers/error"

export type UnwrapQueryResult<T> = {
    data: T, error: null
} | {
    data: null, error: UiError
}

export function unwrapQueryResult<T, E extends BaseException<string, unknown>>(result: Result<T, E>): UnwrapQueryResult<T> {
    if(result.ok) return { data: result.value, error: null }
    return { data: null, error: mapServiceError(result.err) }
}
