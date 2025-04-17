"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps, } from "./color-mode"
import { system } from "@/theme"

export function Provider(props: ColorModeProviderProps) {
    const { children, ...p } = props
    //tips: 从chakra snippet直接取得的此Provider，ColorModeProvider和ChakraProvider的嵌套顺序是反过来的，然而会引发水合错误
    //虽然不清楚原因，但是调换顺序，至少不会出现此错误
    return (
        <ColorModeProvider {...p}>
            <ChakraProvider value={system}>
                {children}
            </ChakraProvider>
        </ColorModeProvider>
    )
}
