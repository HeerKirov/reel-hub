
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
    }
}

export const dates = {
    parseStandardText(str: string): Date | undefined {
        const re = /(?<Y>\d+)-(?<M>\d+)(-(?<D>\d+))?/
        const matcher = str.match(re)
        if(matcher && matcher.groups) {
            return new Date(parseInt(matcher.groups["Y"]), parseInt(matcher.groups["M"]), matcher.groups["D"] !== undefined ? parseInt(matcher.groups["D"]) : 1)
        }else{
            const d = new Date(str)
            if(isNaN(d.getTime())) {
                return undefined
            }
            return d
        }
    },
    toDailyText(date: Date, now?: Date): string {
        const current = now ?? new Date()
        const today = new Date(current.getFullYear(), current.getMonth(), current.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const timeStr = `${numbers.zero(date.getHours(), 2)}:${numbers.zero(date.getMinutes(), 2)}`

        if (date >= today) {
            return timeStr
        } else if (date >= yesterday) {
            return `昨天 ${timeStr}`
        } else {
            return `${date.getFullYear()}-${numbers.zero(date.getMonth() + 1, 2)}-${numbers.zero(date.getDate(), 2)} ${timeStr}`
        }
    }
}