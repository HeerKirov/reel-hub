"use client"
import { useEffect, useState } from "react"
import { RiCloseLine, RiDeleteBinLine, RiSaveLine, RiNumber3, RiNumber2, RiNumber1, RiCheckFill } from "react-icons/ri"
import { Box, Button, Flex, Heading, Popover, Portal } from "@chakra-ui/react"
import { NavigationBreadcrumb } from "./server/layout"

export interface EditorWithTabLayoutProps {
    breadcrumb?: {url?: string, detail?: string, detailIcon?: React.ReactNode}
    tabs?: {label: string, icon?: React.ReactNode, content: React.ReactNode}[]
    header?: React.ReactNode
    bottom?: React.ReactNode
    deleteOptions?: {
        confirmation?: React.ReactNode
        countdown?: number
    }
    onSave?: () => void
    onDelete?: () => void
    onCancel?: () => void
    onComplete?: () => void
}

export function EditorWithTabLayout(props: EditorWithTabLayoutProps) {
    const [tab, setTab] = useState<string>(props.tabs?.[0]?.label ?? "")

    return (
        <>
            {props.breadcrumb && <NavigationBreadcrumb {...props.breadcrumb}/>}

            {props.header && <Heading as="h1" size="3xl" mb={{base: "3", sm: "2"}} textAlign={{base: "center", sm: "left"}}>{props.header}</Heading>}

            <Flex flexWrap={{base: "wrap", sm: "nowrap"}} alignItems="flex-start" gap="3">
                <Box flex="1 0 auto" order={{base: 0, sm: 1}} width={{base: "100%", sm: "200px", md: "220px", lg: "240px", xl: "260px"}}>
                    <Box borderWidth="1px" rounded="md" overflow="hidden" display="flex" flexDirection={{base: "row", sm: "column"}} justifyContent={{base: "stretch", sm: "flex-start"}}>
                        {props.tabs?.map(t => (
                            <Button key={t.label} onClick={() => setTab(t.label)} variant={tab === t.label ? "subtle" : "ghost"} size="sm" flex="1 0 auto" justifyContent={{base: "center", sm: "flex-start"}}>
                                {t.icon}
                                {t.label}
                            </Button>
                        ))}
                    </Box>
                    <Flex gap="2" mt="2" flexDirection={{base: "row", sm: "column"}} justifyContent={{base: "stretch", sm: "flex-start"}}>
                        {(props.onSave ?? false) && <Button colorPalette="blue" size="sm" flex="1 0 auto" onClick={props.onSave}><RiSaveLine/> 保存</Button>}
                        {(props.onComplete ?? false) && <Button variant="outline" colorPalette="green" size="sm" flex="1 0 auto" onClick={props.onComplete}><RiCheckFill/> 完成</Button>}
                        {(props.onDelete ?? false) && <Popover.Root lazyMount unmountOnExit={props.deleteOptions?.countdown !== undefined}>
                            <Popover.Trigger asChild>
                                <Button colorPalette="red" variant={props.onComplete ? "outline" : "solid"} size="sm" flex="1 0 auto"><RiDeleteBinLine/> 删除</Button>
                            </Popover.Trigger>
                            <Portal>
                                <Popover.Positioner>
                                    <Popover.Content width="225px">
                                        <Popover.Arrow />
                                        <Popover.Body>
                                            <DeleteConfirmation confirmation={props.deleteOptions?.confirmation ?? "确认要删除吗？"} onDelete={props.onDelete!} countdown={props.deleteOptions?.countdown}/>
                                        </Popover.Body>
                                    </Popover.Content>
                                </Popover.Positioner>
                            </Portal>
                        </Popover.Root>}
                        {(props.onCancel ?? false) && <Button variant="outline" size="sm" flex="1 0 auto" onClick={props.onCancel}><RiCloseLine/> 取消</Button>}
                    </Flex>
                </Box>
                <Box flex="1 1 100%">
                    {props.tabs?.find(t => t.label === tab)?.content}
                </Box>
            </Flex>

            {props.bottom}
        </>
    )
}

function DeleteConfirmation({ confirmation, onDelete, countdown: initialCountdown }: { confirmation: React.ReactNode, onDelete: () => void, countdown?: number }) {
    const [countdown, setCountdown] = useState(initialCountdown ?? 0)

    useEffect(() => {
        if (countdown === 0) return
        const timer = setTimeout(() => {
            setCountdown(countdown - 1)
        }, 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    let Icon = RiDeleteBinLine
    if (countdown > 0) {
        if (countdown === 3) Icon = RiNumber3
        else if (countdown === 2) Icon = RiNumber2
        else if (countdown === 1) Icon = RiNumber1
    }

    return (<>
        {confirmation}
        <p><Button variant="outline" width="full" colorPalette="red" size="sm" mt="2" onClick={onDelete} disabled={countdown > 0}><Icon /> 删除</Button></p>
    </>)
}