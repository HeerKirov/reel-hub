
export const arrays = {
    associateBy<T, K extends string | number>(arr: T[], mapper: (i: T) => K): Record<K, T> {
        const returns: Record<K, T> = {} as any
        for(const item of arr) {
            returns[mapper(item)] = item
        }
        return returns
    }
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