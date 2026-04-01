import emptyCover from "@/assets/empty.svg"

/** 海报、侧栏等封面图：cover → avatar → 占位 */
export function resCover(resources: Record<string, string>): string {
    return resources["cover"] ?? resources["avatar"] ?? emptyCover.src
}

/** 头像、列表缩略图：avatar → cover → 占位 */
export function resAvatar(resources: Record<string, string>): string {
    return resources["avatar"] ?? resources["cover"] ?? emptyCover.src
}

/**
 * 根据当前query参数，以及给出的新参数，生成一个href，用于在当前path下切换query参数。
 */
export function staticHref(options: {searchParams: Record<string, string> | undefined, key: string | undefined, value: string | null | undefined, removePagination?: boolean}): string {
    if(options.key) {
        const params = {...options.searchParams}
        if(options.value !== null && options.value !== undefined) params[options.key] = options.value
        else delete params[options.key]
        if(options.removePagination && "page" in params) delete params["page"]
        const p = new URLSearchParams(params)
        return `?${p.toString()}`
    }
    return ""
}