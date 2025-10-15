"use client"
import React, { memo, useEffect, useState } from "react"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Box, Button, Flex, Icon, Link } from "@chakra-ui/react"
import { RiArrowRightLine, RiCloseFill } from "react-icons/ri"
import { NumberInput } from "@/components/form"
import { staticHref } from "@/helpers/ui"

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

interface SidePanelFilterStackCollapseItemProps {
    title: React.ReactNode
    header: React.ReactNode
    children: React.ReactNode
    clear?: {paramName: string, searchParams?: Record<string, string>}
    asChild?: boolean
}

export const SidePanelFilterStackCollapseItem = memo(function FilterStackCollapseItem({ title, header, children, asChild, clear }: SidePanelFilterStackCollapseItemProps) {
    const [open, setOpen] = useState(false)

    return (
        <Box>
            <Flex alignItems="baseline">
                <Box flex="1 0 75px" fontSize="sm" textAlign="right" pr="3">{title}</Box>
                <Box flex="1 1 calc(100% - 75px)" asChild={asChild} onClick={() => setOpen(o => !o)}>{header}</Box>
                {clear && clear.searchParams?.[clear.paramName] && <Link transform="translateY(2px)" color="blue.fg" asChild>
                    <NextLink href={staticHref({searchParams: clear.searchParams, key: clear.paramName, value: undefined, removePagination: true})}>
                        <Icon><RiCloseFill/></Icon>
                    </NextLink>
                </Link>}
            </Flex>
            {open && <Box borderTopWidth="1px" borderBottomWidth="1px" px="2" py="1" mt="2">
                {children}
            </Box>}
        </Box>
    )
})