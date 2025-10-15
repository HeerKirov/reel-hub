import React from "react"
import NextLink from "next/link"
import { Box, Button, Icon, IconButton, Link, Popover, Portal, SystemStyleObject, Tag } from "@chakra-ui/react"
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine, RiCloseFill } from "react-icons/ri"
import { staticHref } from "@/helpers/ui"
import { PageRouterPopover } from "./_components"

export type PaginationProps = { page?: number, total?: number, fullwidth?: boolean, searchParams?: Record<string, string>, pageParamName?: string } & SystemStyleObject

export function CompactPagination({ page = 1, total = 0, fullwidth, searchParams, pageParamName = "page", ...attrs }: PaginationProps) {
    const getHref = (page: number) => {
        return staticHref({searchParams, key: pageParamName, value: String(page < 1 ? 1 : page > total ? total : page)})
    }

    return (
        <Box  my="1" display="flex" justifyContent={fullwidth ? "space-between" : "center"} gap="1" {...attrs}>
            <IconButton flex="0 0 auto" variant="outline" size="sm" disabled={page <= 1} asChild><NextLink href={getHref(1)}><RiArrowLeftDoubleLine/></NextLink></IconButton>
            <IconButton flex="0 0 auto" variant="outline" size="sm" disabled={page <= 1} asChild><NextLink href={getHref(page - 1)}><RiArrowLeftSLine/></NextLink></IconButton>

            <Popover.Root lazyMount unmountOnExit>
                <Popover.Trigger asChild>
                    <Button flex={fullwidth ? "1 1 100%" : undefined} fontWeight="700" variant="outline" size="sm">{page} / {total}</Button>
                </Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content width="210px">
                            <Popover.Arrow />
                            <Popover.Body display="flex" gap="1">
                                <PageRouterPopover page={page} total={total} pageParamName={pageParamName}/>
                            </Popover.Body>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>
            <IconButton flex="0 0 auto" variant="outline" size="sm" disabled={page >= total} asChild><NextLink href={getHref(page + 1)}><RiArrowRightSLine/></NextLink></IconButton>
            <IconButton flex="0 0 auto" variant="outline" size="sm" disabled={page >= total} asChild><NextLink href={getHref(total)}><RiArrowRightDoubleLine/></NextLink></IconButton>
        </Box>
    )
}

export type LinkGroupFilterProps = { items?: {label: string, value: string, color: SystemStyleObject["color"]}[], searchParams?: Record<string, string>, searchParamName?: string } & SystemStyleObject

export function LinkGroupFilter({ items, searchParams, searchParamName, ...attrs }: LinkGroupFilterProps) {
    const current = searchParams && searchParamName ? searchParams[searchParamName] : undefined

    return (
        <Box display="flex" gap="2" flexWrap="wrap" {...attrs}>
            {items?.map(item => (
                <Link key={item.value} variant="underline" color={current === (item.value || undefined) ? `${item.color}.fg` : "fg.subtle"} fontWeight={700} asChild>
                    <NextLink href={staticHref({searchParams, key: searchParamName, value: item.value || undefined, removePagination: true})}>{item.label}</NextLink>
                </Link>
            ))}
        </Box>
    )
}

export function PublishTimeFilterHeader({ publishTime, mode = "month", searchParams }: {publishTime?: string, mode?: "month" | "season", searchParams?: Record<string, string>}) {
    if(publishTime) {
        const [year, month] = publishTime.split("-")
        const str = month ? mode === "season" ? `${year}年${parseInt(month)}-${parseInt(month) + 2}月` : `${year}年${parseInt(month)}月` : `${year}年`
        return (
            <Link variant="underline" fontWeight="700" color="blue.fg">{str}</Link>
        )
    }else{
        return (
            <Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>
        )
    }
}

export function TagFilterHeader({ searchParams }: {searchParams?: Record<string, string>}) {
    if(searchParams?.tag) {
        return (
            <Tag.Root size="lg">
                <Tag.Label>{searchParams.tag}</Tag.Label>
            </Tag.Root>
        )
    }else{
        return (
            <Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>
        )
    }
}

export function StaffFilterHeader({ searchParams }: {searchParams?: Record<string, string>}) {
    if(searchParams?.staff) {
        return (
            <Link variant="underline" fontWeight="700" color="blue.fg">{searchParams.staff}</Link>
        )
    }else{
        return (
            <Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>
        )
    }
}