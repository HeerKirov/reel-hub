"use client"
import React, { memo, useMemo } from "react"
import { Box, SystemStyleObject, useBreakpointValue } from "@chakra-ui/react"
import { useIsClient } from "@/helpers/hooks"

export type ResponsiveIfProps = {
    show: {base?: boolean, sm?: boolean, md?: boolean, lg?: boolean, xl?: boolean} | [boolean, boolean, boolean, boolean, boolean]
    children?: React.ReactNode
} & SystemStyleObject

export const ResponsiveIf = memo(function ResponsiveIf(props: ResponsiveIfProps) {
    const { show, children, display, ...attrs } = props
    const showList = show instanceof Array ? show : [show.base, show.sm, show.md, show.lg, show.xl]
    const value = useMemo(() => {
        const base = showList[0] ?? true
        const sm = showList[1] !== undefined ? showList[1] : base
        const md = showList[2] !== undefined ? showList[2] : sm
        const lg = showList[3] !== undefined ? showList[3] : md
        const xl = showList[4] !== undefined ? showList[4] : lg
        console.log("value", {base, sm, md, lg, xl})
        return {base, sm, md, lg, xl}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showList[0], showList[1], showList[2], showList[3], showList[4]])

    const shown = useBreakpointValue(value)

    const isClient = useIsClient()

    const ifShown = isClient ? shown : true

    const displayStyle: SystemStyleObject["display"] = useMemo(() => {
        const base = showList[0] ? (display ?? "block") : showList[0] === false ? "none" : undefined
        const sm = showList[1] ? (display ?? "block") : showList[1] === false ? "none" : undefined
        const md = showList[2] ? (display ?? "block") : showList[2] === false ? "none" : undefined
        const lg = showList[3] ? (display ?? "block") : showList[3] === false ? "none" : undefined
        const xl = showList[4] ? (display ?? "block") : showList[4] === false ? "none" : undefined
        return {base, sm, md, lg, xl}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [display, showList[0], showList[1], showList[2], showList[3], showList[4]])

    console.log("shown:", shown, "isClient:", isClient, "displayStyle:", displayStyle)

    return (
        ifShown && <Box display={displayStyle} {...attrs}>
            {children}
        </Box>
    )
})