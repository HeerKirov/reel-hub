import type { Prisma } from "@/prisma/generated"
import { prisma } from "@/lib/prisma"
import { exceptionInternalServerError, isBaseException, type BaseException, type InternalServerError } from "@/constants/exception"
import type { Result } from "@/schemas/all"

function isThrownResultFailure(value: unknown): value is Result<never, BaseException<string, unknown>> {
    if(typeof value !== "object" || value === null) return false
    const o = value as { ok?: unknown, err?: unknown }
    return o.ok === false && "err" in value
}

/**
 * 包裹返回 Result 的异步逻辑：捕获非预期异常并映射为 INTERNAL_SERVER_ERROR；
 * BaseException 视为预期错误原样返回。不开启数据库事务，适用于只读或无需与多步写入原子化的 API。
 */
export async function safeExecute<T, E extends BaseException<string, unknown>>(fn: () => Promise<Result<T, E>>): Promise<Result<T, E | InternalServerError>> {
    try {
        return await fn()
    } catch (error) {
        if(isBaseException(error)) {
            return { ok: false, err: error as E }
        }
        console.error("[safeExecute] unexpected exception", error)
        return { ok: false, err: exceptionInternalServerError() }
    }
}

export type SafeExecuteTransactionOptions = {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
}

/**
 * 在 Prisma 交互式事务中执行回调：回调内应使用传入的 `tx` 进行读写。
 * 若回调返回 `Result` 且 `ok === false`，会主动 `throw` 以触发事务回滚（Prisma 无单独 rollback API，抛错即回滚），
 * 外层再还原为同一 `Result`；未捕获异常或非预期错误仍映射为 INTERNAL_SERVER_ERROR。
 */
export async function safeExecuteTransaction<T, E extends BaseException<string, unknown>>(fn: (tx: Prisma.TransactionClient) => Promise<Result<T, E>>, options?: SafeExecuteTransactionOptions): Promise<Result<T, E | InternalServerError>> {
    try {
        return await prisma.$transaction(async tx => {
            const result = await fn(tx)
            if(!result.ok) {
                throw result
            }
            return result
        }, options)
    } catch (error) {
        if(isThrownResultFailure(error)) {
            return error as Result<T, E>
        }
        if(isBaseException(error)) {
            return { ok: false, err: error as E }
        }
        console.error("[safeExecuteTransaction] unexpected exception", error)
        return { ok: false, err: exceptionInternalServerError() }
    }
}
