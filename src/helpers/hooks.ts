import { useCallback, useEffect, useState } from "react"

export function useIsClient() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true)
    }, [])

    return isClient
}

export function useEffectState<T>(origin: T) {
    const [value, setValue] = useState<T>(origin)

    useEffect(() => {
        if(value !== origin) setValue(origin)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin])

    return [value, setValue] as const
}

export function useEffectComputed<T, V>(origin: T, computed: (value: T) => V, computedDeps?: React.DependencyList) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const computedFn = useCallback((value: T) => computed(value), computedDeps ?? [])

    const [value, setValue] = useState<V>(computedFn(origin))

    useEffect(() => {
        const newValue = computedFn(origin)
        if(value !== newValue) setValue(newValue)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin, computedFn])

    return [value, setValue] as const
}
