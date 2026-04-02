
export const arrays = {
    associateBy<T, K extends string | number>(arr: T[], mapper: (i: T) => K): Record<K, T> {
        const returns: Record<K, T> = {} as any
        for(const item of arr) {
            returns[mapper(item)] = item
        }
        return returns
    },
    associate<T, K extends string | number, V>(arr: T[], mapper: (i: T) => K, mapper2: (t: T) => V): Record<K, V> {
        const returns: Record<K, V> = {} as any
        for(const item of arr) {
            returns[mapper(item)] = mapper2(item)
        }
        return returns
    },
    groupBy<K extends string | number, T>(arr: T[], mapper: (i: T) => K): Record<K, T[]> {
        const returns: Record<K, T[]> = {} as any
        for(const item of arr) {
            const key = mapper(item)
            if(!returns[key]) returns[key] = []
            returns[key].push(item)
        }
        return returns
    },
    groupByTo<K extends string | number, T, V>(arr: T[], mapper: (i: T) => K, mapper2: (i: T) => V): Record<K, V[]> {
        const returns: Record<K, V[]> = {} as any
        for(const item of arr) {
            const key = mapper(item)
            if(!returns[key]) returns[key] = []
            returns[key].push(mapper2(item))
        }
        return returns
    },
    equals<T>(a: T[], b: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; ++i) {
            if (!eq(a[i], b[i])) {
                return false
            }
        }
        return true
    },
}

export const objects = {
    deepEquals(a: any, b: any): boolean {
        const typeA = a === null ? "null" : typeof a
        const typeB = b === null ? "null" : typeof b

        if(typeA === "object" && typeB === "object") {
            const aIsArray = a instanceof Array, bIsArray = b instanceof Array
            if(aIsArray && bIsArray) {
                if(arrays.equals(a, b, objects.deepEquals)) {
                    return true
                }
            }else if(!aIsArray && !bIsArray) {
                if(records.equals(a, b, objects.deepEquals)) {
                    return true
                }
            }
            return false
        }else if(typeA !== typeB) {
            return false
        }else{
            return a === b
        }
    }
}

export const records = {
    map<K extends string | number, T, R>(record: Record<K, T>, mapper: (i: T) => R): Record<K, R> {
        const returns: Record<K, R> = {} as any
        for(const [key, value] of Object.entries(record)) {
            returns[key as K] = mapper(value as T)
        }
        return returns
    },
    equals<T>(a: {[key: string]: T}, b: {[key: string]: T}, eq: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        const entriesA = Object.entries(a)
        if(entriesA.length !== Object.keys(b).length) {
            return false
        }
        for(const [key, valueA] of entriesA) {
            if(!b.hasOwnProperty(key) || !eq(valueA, b[key])) {
                return false
            }
        }
        return true
    }
}

export const numbers = {
    zero(n: number | string, length: number): string {
        let s = n.toString()
        if(s.length < length) {
            for(let i = 0; i < length - s.length; i++) s = "0" + s
        }
        return s
    },
    formatCurrency(n: number): string {
        return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
}

export const dates = {
    parseDate(str: string): Date | undefined {
        const re = /(?<Y>\d+)-(?<M>\d+)(-(?<D>\d+))?/
        const matcher = str.match(re)
        if(matcher && matcher.groups) {
            return new Date(parseInt(matcher.groups["Y"]), parseInt(matcher.groups["M"]) - 1, matcher.groups["D"] !== undefined ? parseInt(matcher.groups["D"]) : 1)
        }else{
            const d = new Date(str)
            if(isNaN(d.getTime())) {
                return undefined
            }
            return d
        }
    },
    resolveTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        } catch {
            return "UTC"
        }
    },
    isValidIanaTimeZone(tz: string): boolean {
        try {
            new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date())
            return true
        } catch {
            return false
        }
    },
    formatDisplayDatetime(value: Date | string | number | null | undefined, variant: DisplayDatetimeVariant, timeZone: string | undefined, locale: string = "zh-CN", now: Date | null = null, emptyLabel: string = "-"): string {
        if(value === null || value === undefined) return emptyLabel
        const d = value instanceof Date ? value : new Date(value)
        if(Number.isNaN(d.getTime())) return emptyLabel

        switch(variant) {
            case "dateTime":
                return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium", timeStyle: "short" }).format(d)
            case "dateOnly":
                return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium" }).format(d)
            case "timeOnly":
                return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(d)
            case "dailyText": {
                const currentDate = now ?? new Date()
                const parts = zonedYmdHmForDisplay(d, timeZone)
                const timeStr = `${numbers.zero(parts.h, 2)}:${numbers.zero(parts.min, 2)}`
                const dKey = zonedDateKeyForDisplay(d, timeZone)
                const todayKey = zonedDateKeyForDisplay(currentDate, timeZone)
                if(dKey === todayKey) return timeStr
                const yestKey = addCalendarDayKeyForDisplay(todayKey, -1)
                if(dKey === yestKey) return `昨天 ${timeStr}`
                return `${parts.y}-${numbers.zero(parts.m, 2)}-${numbers.zero(parts.day, 2)} ${timeStr}`
            }
            default:
                return emptyLabel
        }
    },
    /** 使用运行环境默认 IANA 时区（浏览器或 Node）与 zh-CN，等同 `formatDisplayDatetime` 的各 variant；适用于 Client Component */
    format(value: Date | string | number | null | undefined, variant: DisplayDatetimeVariant, emptyLabel = "—"): string {
        return dates.formatDisplayDatetime(value, variant, undefined, "zh-CN", null, emptyLabel)
    }
}

export type DisplayDatetimeVariant = "dateTime" | "dateOnly" | "timeOnly" | "dailyText"

function zonedYmdHmForDisplay(d: Date, timeZone: string | undefined): { y: number, m: number, day: number, h: number, min: number } {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    const o: Record<string, string> = {}
    for(const p of f.formatToParts(d)) {
        if(p.type !== "literal" && p.type !== "timeZoneName") o[p.type] = p.value
    }
    return { y: +o.year, m: +o.month, day: +o.day, h: +o.hour, min: +o.minute }
}

function zonedDateKeyForDisplay(d: Date, timeZone: string | undefined): string {
    const p = zonedYmdHmForDisplay(d, timeZone)
    return `${p.y}-${numbers.zero(p.m, 2)}-${numbers.zero(p.day, 2)}`
}

function addCalendarDayKeyForDisplay(key: string, delta: number): string {
    const [y, m, d] = key.split("-").map(Number)
    const u = new Date(Date.UTC(y, m - 1, d + delta))
    return `${u.getUTCFullYear()}-${numbers.zero(u.getUTCMonth() + 1, 2)}-${numbers.zero(u.getUTCDate(), 2)}`
}
