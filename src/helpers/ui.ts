
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