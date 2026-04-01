
export interface BaseException<C extends string, I> {
    code: C
    message: string
    info: I
}

/**
 * 参数类型错误。表单或查询参数传递了错误的类型。
 */
export type ParamTypeError = BaseException<"PARAM_TYPE_ERROR", string>
/**
 * 参数错误。通用的错误类型，通常用于参数验证失败。
 */
export type ParamError = BaseException<"PARAM_ERROR", string>
/**
 * 参数错误。该参数是必须传递的，但实际缺失。
 */
export type ParamRequired = BaseException<"PARAM_REQUIRED", string>
/**
 * 参数错误。该参数是不应该传递的，但实际有值。
 */
export type ParamNotRequired = BaseException<"PARAM_NOT_REQUIRED", string>

/**
 * 404资源未找到。该错误指当前请求的资源主体不存在。(例如，在请求Project时，如果根据projectId找不到，则应当抛出此错误)
 */
export type NotFound = BaseException<"NOT_FOUND", null>
/**
 * 资源不存在。该错误指在当前操作中搜索的另一项关联资源不存在。(例如，在编辑Project的关联Tag时，如果根据给出的tagId找不到，则应当抛出此错误)
 */
export type ResourceNotExist<P extends string, V> = BaseException<"NOT_EXIST", {resourceName: P, resourceValue: V}>
/**
 * 资源不适用于当前主体。(例如，在编辑Project的关联Tag时，如果给出的Tag与Project不同类型，也就是说它不适用，则应当抛出此错误)
 */
export type ResourceNotSuitable<P extends string, V> = BaseException<"NOT_SUITABLE", {resourceName: P, resourceValue: V}>
/**
 * 资源已存在。该错误指创建或修改唯一性资源时已存在的情况。
 */
export type AlreadyExists<R extends string, P extends string, V> = BaseException<"ALREADY_EXISTS", {relationName: R, resourceName: P, resourceValue: V}>
/**
 * 拒绝操作。通常用于业务逻辑上的拒绝。这是一个通用的拒绝错误。
 */
export type Reject = BaseException<"REJECT", null>
/**
 * 拒绝操作。表示NextEpisode中推进到下一话的操作不满足条件。
 */
export type RejectNextEpisode = BaseException<"REJECT_NEXT_EPISODE", null>
/**
 * 拒绝操作。表示CreateProgress中创建新的进度操作不满足条件。
 */
export type RejectCreateProgress = BaseException<"REJECT_CREATE_PROGRESS", null>

/**
 * 未授权。该错误指当前请求未授权。
 */
export type Unauthorized = BaseException<"UNAUTHORIZED", null>
/**
 * 禁止访问。该错误指当前请求被禁止访问。
 */
export type Forbidden = BaseException<"FORBIDDEN", null>
/**
 * 内部服务器错误。该错误指服务器在处理请求时发生了未知的错误。
 */
export type InternalServerError = BaseException<"INTERNAL_SERVER_ERROR", null>


export function exceptionResourceNotExist<P extends string, V>(resourceName: P, resourceValue: V): ResourceNotExist<P, V> {
    return {
        code: "NOT_EXIST",
        message: `${resourceName} not exist`,
        info: { resourceName, resourceValue }
    }
}

export function exceptionResourceNotSuitable<P extends string, V>(resourceName: P, resourceValue: V): ResourceNotSuitable<P, V> {
    return {
        code: "NOT_SUITABLE",
        message: `${resourceName} is not suitable`,
        info: { resourceName, resourceValue }
    }
}

export function exceptionAlreadyExists<R extends string, P extends string, V>(relationName: R, resourceName: P, resourceValue: V): AlreadyExists<R, P, V> {
    return {
        code: "ALREADY_EXISTS",
        message: `${relationName} already exists`,
        info: { relationName, resourceName, resourceValue }
    }
}

export function exceptionUnauthorized(): Unauthorized {
    return { code: "UNAUTHORIZED", message: "Unauthorized", info: null }
}

export function exceptionForbidden(): Forbidden {
    return { code: "FORBIDDEN", message: "Forbidden", info: null }
}

export function exceptionInternalServerError(message: string = "Internal server error"): InternalServerError {
    return { code: "INTERNAL_SERVER_ERROR", message, info: null }
}

export function exceptionParamError(message: string): ParamError {
    return { code: "PARAM_ERROR", message, info: message }
}

export function exceptionParamRequired(paramName: string): ParamRequired {
    return { code: "PARAM_REQUIRED", message: `${paramName} is required`, info: paramName }
}

export function exceptionParamNotRequired(paramName: string): ParamNotRequired {
    return { code: "PARAM_NOT_REQUIRED", message: `${paramName} is not required`, info: paramName }
}

export function exceptionNotFound(message: string = "Not found"): NotFound {
    return { code: "NOT_FOUND", message, info: null }
}

export function exceptionReject(message: string = "Rejected"): Reject {
    return { code: "REJECT", message, info: null }
}

export function exceptionRejectNextEpisode(message: string = "Next episode is not available"): RejectNextEpisode {
    return { code: "REJECT_NEXT_EPISODE", message, info: null }
}

export function exceptionRejectCreateProgress(message: string = "Create progress is not available"): RejectCreateProgress {
    return { code: "REJECT_CREATE_PROGRESS", message, info: null }
}

export function isBaseException(error: unknown): error is BaseException<string, unknown> {
    if(typeof error !== "object" || error === null) return false
    return "code" in error && "message" in error && "info" in error
}