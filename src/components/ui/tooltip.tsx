"use client"

import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react"
import * as React from "react"

export interface TooltipProps extends ChakraTooltip.RootProps {
    showArrow?: boolean
    portalled?: boolean
    portalRef?: React.RefObject<HTMLElement | null>
    content: React.ReactNode
    contentProps?: ChakraTooltip.ContentProps
    disabled?: boolean
}

/**
 * asChild 必须落在 Client 侧真实 DOM 上；直接作用到 RSC 传入的 Chakra 节点时 ref 合并会失败，Trigger 整段不挂载。
 */
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
    function Tooltip(props, ref) {
        const {
            showArrow,
            children,
            disabled,
            portalled = true,
            content,
            contentProps,
            portalRef,
            ...rest
        } = props

        if (disabled) return children

        return (
            <ChakraTooltip.Root {...rest}>
                <ChakraTooltip.Trigger asChild>
                    <span style={{ display: "inline-flex", maxWidth: "100%", verticalAlign: "middle" }}>
                        {children}
                    </span>
                </ChakraTooltip.Trigger>
                <Portal disabled={!portalled} container={portalRef}>
                    <ChakraTooltip.Positioner>
                        <ChakraTooltip.Content ref={ref} {...contentProps}>
                            {showArrow && (
                                <ChakraTooltip.Arrow>
                                    <ChakraTooltip.ArrowTip />
                                </ChakraTooltip.Arrow>
                            )}
                            {content}
                        </ChakraTooltip.Content>
                    </ChakraTooltip.Positioner>
                </Portal>
            </ChakraTooltip.Root>
        )
    },
)
