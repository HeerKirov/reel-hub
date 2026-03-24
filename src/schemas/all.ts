
export type Result<T, E> = {
    ok: true
    value: T
} | {
    ok: false
    err: E
}

export interface ListResult<T> {
    list: T[]
    total: number
}

export function ok<T, E>(value: T): Result<T, E> {
    return { ok: true, value }
}

export function err<T, E>(e: E): Result<T, E> {
    return { ok: false, err: e }
}

