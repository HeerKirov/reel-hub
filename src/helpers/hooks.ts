import { useEffect, useState } from "react"

export function useIsClient() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
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
