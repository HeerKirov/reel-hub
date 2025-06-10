
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
}

export const records = {
    map<K extends string | number, T, R>(record: Record<K, T>, mapper: (i: T) => R): Record<K, R> {
        const returns: Record<K, R> = {} as any
        for(const [key, value] of Object.entries(record)) {
            returns[key as K] = mapper(value as T)
        }
        return returns
    }
}