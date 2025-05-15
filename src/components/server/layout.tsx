import React from "react"
import NextLink from "next/link"
import { Box, Breadcrumb, CloseButton, Drawer, Flex, Heading, IconButton, Portal, Stack, Text } from "@chakra-ui/react"
import { RiFilter2Line } from "react-icons/ri"
import { NAVIGATIONS } from "@/constants/ui"
import { ResponsiveIf } from "@/components/logical"
import { CompactPagination } from "@/components/server/filters"
import { SidePanelFilterStackCollapseItem } from "./_components"

export function NavigationBreadcrumb(props: {url?: string, detail?: string, detailIcon?: React.ReactNode}) {
    const nItem = props.url ? NAVIGATIONS.find(n => props.url!.startsWith(n.href)) : undefined
    const nsItem = nItem?.children?.find(n => props.url!.startsWith(n.href))

    const link1 = nItem && <Breadcrumb.Item>
        <Breadcrumb.Link asChild><NextLink href={nItem.href}>{nItem.icon} {nItem.label}</NextLink></Breadcrumb.Link>
    </Breadcrumb.Item>

    const link2 = nsItem && <Breadcrumb.Item>
        <Breadcrumb.Link asChild><NextLink href={nsItem.href}>{nsItem.icon} {nsItem.label}</NextLink></Breadcrumb.Link>
    </Breadcrumb.Item>

    const link3 = props.detail && <Breadcrumb.Item>
        <Breadcrumb.Link>{props.detailIcon} {props.detail}</Breadcrumb.Link>
    </Breadcrumb.Item>

    return (
        <Breadcrumb.Root py="3">
            <Breadcrumb.List>
                {link1}
                {link1 && (link2 || link3) ? <Breadcrumb.Separator/> : undefined}
                {link2}
                {(link1 || link2) && link3 ? <Breadcrumb.Separator/> : undefined}
                {link3}
            </Breadcrumb.List>
        </Breadcrumb.Root>
    )
}

export type ListPageLayoutProps<PARAMS extends Record<string, string>> = {
    searchParams: PARAMS
    breadcrumb?: {url?: string, detail?: string, detailIcon?: React.ReactNode}
    bar?: React.ReactNode
    filter?: React.ReactNode
    content?: React.ReactNode
    totalRecord?: number
    totalPage?: number
    currentPage?: number
}

export function ListPageLayout<PARAMS extends Record<string, string>>(props: ListPageLayoutProps<PARAMS>) {
    return (
        <>
            {props.breadcrumb && <NavigationBreadcrumb {...props.breadcrumb}/>}

            <Flex flexWrap={{base: "wrap", md: "nowrap"}} alignItems="flex-start" gap="3">
                <ListPageLayoutSidePanel searchParams={props.searchParams} bar={props.bar} filter={props.filter ?? undefined} totalRecord={props.totalRecord} totalPage={props.totalPage} currentPage={props.currentPage}/>
                <Box flex="1 1 100%" asChild>
                    {props.content}
                </Box>
            </Flex>

            <ResponsiveIf show={{md: false}}>
                {props.totalPage !== undefined && props.totalPage > 1 && <CompactPagination mt="1" page={props.currentPage} total={props.totalPage} searchParams={props.searchParams}/>}
                {props.totalRecord !== undefined && <Text textAlign="center">共 {props.totalRecord} 条记录</Text>}
            </ResponsiveIf>
        </>
    )
}


async function ListPageLayoutSidePanel<PARAMS extends Record<string, string>>({ searchParams, bar, filter, totalRecord, totalPage, currentPage }: Omit<ListPageLayoutProps<PARAMS>, "breadcrumb" | "content">) {
    return (<Box flex="1 0 auto" order={{base: 0, md: 1}} width={{base: "100%", md: "220px", lg: "240px", xl: "260px"}}>
        <Box display="flex" justifyContent="space-between" borderWidth="1px" rounded="md">
            {bar ?? <Box flex="1 1 100%"/>}

            <ResponsiveIf show={{base: true, md: false}} asChild>
                <Drawer.Root>
                    <Drawer.Trigger asChild>
                        <IconButton ml="2" variant="ghost" size="sm"><RiFilter2Line/></IconButton>
                    </Drawer.Trigger>
                    <Portal>
                        <Drawer.Backdrop />
                        <Drawer.Positioner>
                            <Drawer.Content>
                                <Drawer.Header>
                                    <Drawer.Title>筛选</Drawer.Title>
                                </Drawer.Header>
                                <Drawer.Body>
                                    {filter}
                                </Drawer.Body>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton size="sm" />
                                </Drawer.CloseTrigger>
                            </Drawer.Content>
                        </Drawer.Positioner>
                    </Portal>
                </Drawer.Root>
            </ResponsiveIf>
        </Box>
        <ResponsiveIf show={{base: false, md: true}}>
            <Box mt="1" py="1" px="2" borderWidth="1px" rounded="md">
                {filter}
            </Box>
            <CompactPagination mt="1" fullwidth page={currentPage} total={totalPage} searchParams={searchParams}/>
            {totalRecord !== undefined && <Text>共 {totalRecord} 条记录</Text>}
        </ResponsiveIf>
    </Box>)
}


export const SidePanel = {
    FilterStack: function FilterStack({ children }: {children: React.ReactNode}) {
        return (
            <Stack gap="3" my="3" fontSize="sm">
                {children}
            </Stack>
        )
    },
    FilterStackItem: function FilterStackItem({ title, children, asChild }: {title?: React.ReactNode, children?: React.ReactNode, asChild?: boolean}) {
        return (
            <Flex alignItems="baseline">
                <Box flex="1 0 75px" fontSize="sm" textAlign="right" pr="3">{title}</Box>
                <Box flex="1 1 100%" asChild={asChild}>{children}</Box>
            </Flex>
        )
    },
    FilterStackCollapseItem: SidePanelFilterStackCollapseItem
}

export type DetailPageLayoutProps = {
    breadcrumb?: {url?: string, detail?: string, detailIcon?: React.ReactNode}
    header?: React.ReactNode
    side?: React.ReactNode
    content?: React.ReactNode
    bottom?: React.ReactNode
}

export function DetailPageLayout(props: DetailPageLayoutProps) {
    return (
        <>
            {props.breadcrumb && <NavigationBreadcrumb {...props.breadcrumb}/>}

            {props.header && <Heading as="h1" size="3xl" mb={{base: "3", sm: "2"}} textAlign={{base: "center", sm: "left"}}>{props.header}</Heading>}

            <Flex flexWrap={{base: "wrap", sm: "nowrap"}} alignItems="flex-start" gap="3">
                <Box flex="1 0 auto" order={{base: 0, sm: 1}} width={{base: "100%", sm: "200px", md: "220px", lg: "240px", xl: "260px"}} borderWidth="1px" rounded="md" overflow="hidden">
                    {props.side}
                </Box>
                <Box flex="1 1 100%">
                    {props.content}
                </Box>
            </Flex>

            {props.bottom}
        </>
    )
}