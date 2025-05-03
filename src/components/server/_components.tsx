"use client"
import React, { ChangeEvent, KeyboardEvent, memo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Box, Button, Collapsible, Flex, Input } from "@chakra-ui/react"
import { RiArrowRightLine } from "react-icons/ri"

export const PageRouterPopover = memo(function PageRouterPopover(props: {page: number, total: number, pageParamName: string}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [page, setPage] = useState<string>(String(props.page))

    useEffect(() => setPage(String(props.page)), [props.page])

    const onClick = () => {
        const p = new URLSearchParams(searchParams.toString())
        p.set(props.pageParamName, page)
        router.push(`?${p.toString()}`)
    }

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPage(e.target.value)
    }

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter") {
            onClick()
        }
    }

    return (
        <>
            <Input type="number" placeholder="页码" size="sm" min="1" max={props.total} value={page} onChange={onChange} onKeyDown={onKeyDown}/>
            <Button type="submit" variant="outline" size="sm" onClick={onClick}><RiArrowRightLine/> 跳转</Button>
        </>
    )
})

export const SidePanelFilterStackCollapseItem = memo(function SidePanelFilterStackCollapseItem({ title, header, children, asChild }: {title?: React.ReactNode, header?: React.ReactNode, children?: React.ReactNode, asChild?: boolean}) {
    const [open, setOpen] = useState(false)

    console.log("open", open)

    return (
        <Box>
            <Flex alignItems="baseline">
                <Box flex="1 0 75px" fontSize="sm" textAlign="right" pr="3">{title}</Box>
                <Box flex="1 1 100%" asChild={asChild} onClick={() => setOpen(o => !o)}>{header}</Box>
            </Flex>
            <Collapsible.Root lazyMount open={open} onOpenChange={d => setOpen(d.open)}>
                <Collapsible.Content borderTopWidth="1px" borderBottomWidth="1px" px="2" py="1" mt="2">
                    {children}
                </Collapsible.Content>
            </Collapsible.Root>
        </Box>
    )
})