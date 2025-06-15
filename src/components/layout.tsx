"use client"
import { useState } from "react"
import { RiCloseLine, RiDeleteBinLine, RiSaveLine } from "react-icons/ri"
import { Box, Button, Flex, Heading, Popover, Portal } from "@chakra-ui/react"
import { NavigationBreadcrumb } from "./server/layout"

export interface EditorWithTabLayoutProps {
    breadcrumb?: {url?: string, detail?: string, detailIcon?: React.ReactNode}
    tabs?: {label: string, icon?: React.ReactNode, content: React.ReactNode}[]
    header?: React.ReactNode
    bottom?: React.ReactNode
    onSave?: () => void
    onDelete?: () => void
    onCancel?: () => void
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
                        <Button colorPalette="blue" size="sm" flex="1 0 auto" onClick={props.onSave}><RiSaveLine/> 保存</Button>
                        {(props.onDelete ?? false) && <Popover.Root>
                            <Popover.Trigger asChild>
                                <Button colorPalette="red" size="sm" flex="1 0 auto"><RiDeleteBinLine/> 删除</Button>
                            </Popover.Trigger>
                            <Portal>
                                <Popover.Positioner>
                                    <Popover.Content width="150px">
                                        <Popover.Arrow />
                                        <Popover.Body>
                                            <p>确认要删除吗？</p>
                                            <Button variant="outline" width="full" colorPalette="red" size="sm" mt="2" onClick={props.onDelete}><RiDeleteBinLine/> 删除</Button>
                                        </Popover.Body>
                                    </Popover.Content>
                                </Popover.Positioner>
                            </Portal>
                        </Popover.Root>}
                        <Button variant="outline" size="sm" flex="1 0 auto" onClick={props.onCancel}><RiCloseLine/> 取消</Button>
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