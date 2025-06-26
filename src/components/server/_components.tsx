"use client"
import React, { memo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Box, Button, Flex } from "@chakra-ui/react"
import { RiArrowRightLine } from "react-icons/ri"
import { NumberInput } from "@/components/form"

export const PageRouterPopover = memo(function PageRouterPopover(props: {page: number, total: number, pageParamName: string}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [page, setPage] = useState<number | null>(props.page)

    useEffect(() => setPage(props.page), [props.page])

    const onClick = () => {
        const p = new URLSearchParams(searchParams.toString())
        p.set(props.pageParamName, String(page))
        router.push(`?${p.toString()}`)
    }

    return (
        <>
            <NumberInput placeholder="页码" size="sm" min={1} max={props.total} value={page} onValueChange={setPage} onEnter={onClick}/>
            <Button type="submit" variant="outline" size="sm" onClick={onClick}><RiArrowRightLine/> 跳转</Button>
        </>
    )
})

export const SidePanelFilterStackCollapseItem = memo(function FilterStackCollapseItem({ title, header, children, asChild }: {title?: React.ReactNode, header?: React.ReactNode, children?: React.ReactNode, asChild?: boolean}) {
    const [open, setOpen] = useState(false)

    return (
        <Box>
            <Flex alignItems="baseline">
                <Box flex="1 0 75px" fontSize="sm" textAlign="right" pr="3">{title}</Box>
                <Box flex="1 1 calc(100% - 75px)" asChild={asChild} onClick={() => setOpen(o => !o)}>{header}</Box>
            </Flex>
            {open && <Box borderTopWidth="1px" borderBottomWidth="1px" px="2" py="1" mt="2">
                {children}
            </Box>}
        </Box>
    )
})