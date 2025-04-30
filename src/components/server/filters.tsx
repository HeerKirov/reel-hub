import { memo } from "react"
import NextLink from "next/link"
import { Box, Button, IconButton, Popover, Portal, SystemStyleObject } from "@chakra-ui/react"
import {
    RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine
} from "react-icons/ri"
import { PageRouterPopover } from "./_components"

export type PaginationProps = { page?: number, total?: number, fullwidth?: boolean, searchParams?: Record<string, string>, pageParamName?: string } & SystemStyleObject

export const CompactPagination = memo(function PageRouter({ page = 1, total = 0, fullwidth, searchParams, pageParamName = "page", ...attrs }: PaginationProps) {
    const getHref = (page: number) => {
        const p = new URLSearchParams({...searchParams, [pageParamName]: String(page < 1 ? 1 : page > total ? total : page)})
        return `?${p.toString()}`
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
})
