import NextLink from "next/link"
import { RiArrowDownSFill, RiBillLine, RiFundsBoxLine } from "react-icons/ri"
import { Avatar, Box, Button, Icon, Menu, Portal, Table, Text } from "@chakra-ui/react"
import { SearchBox } from "@/components/filters"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { LinkGroupFilter } from "@/components/server/filters"
import { InlineError } from "@/components/app/inline-error"
import { ONLINE_TYPE_ITEMS, PLATFORM_ITEMS, Platform, OnlineType } from "@/constants/game"
import { SHOPPING_TYPE_LABEL, SHOPPING_TYPE_SELECT_ITEMS, ShoppingType } from "@/constants/purchase"
import { PurchaseSummaryWithProjectSchema, PurchaseWithProjectSchema } from "@/schemas/purchase"
import { listPurchaseSummary, listPurchases } from "@/services/purchase"
import { dates, numbers } from "@/helpers/primitive"
import { unwrapQueryResult } from "@/helpers/result"
import { staticHref } from "@/helpers/ui"

export interface PurchaseListSearchParams {
    page?: string
    search?: string
    view?: "records" | "summary"
    purchaseType?: ShoppingType
    platform?: Platform
    onlineType?: OnlineType
    orderBy?: "totalCost" | "updateTime"
}

const PAGE_SIZE = 15

export async function PurchaseList(props: { searchParams: Promise<PurchaseListSearchParams> }) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page, 10) : 1
    const view = searchParams.view ?? "records"
    const sp = searchParams as Record<string, string>

    if(view === "summary") {
        const listResult = await listPurchaseSummary({
            page,
            size: PAGE_SIZE,
            search: searchParams.search,
            orderBy: searchParams.orderBy ?? "totalCost",
            platform: searchParams.platform,
            onlineType: searchParams.onlineType
        })
        const { data, error } = unwrapQueryResult(listResult)
        if(error) {
            return <InlineError error={error} />
        }
        const { list, total } = data
        return (
            <ListPageLayout searchParams={sp} breadcrumb={{ url: "/game/purchase" }} bar={<FilterBar searchParams={searchParams} />}
                filter={<FilterPanel searchParams={searchParams} />} content={<ContentSummary list={list} />} totalRecord={total}
                totalPage={Math.ceil(total / PAGE_SIZE)} currentPage={page} />
        )
    }else{
        const listResult = await listPurchases({
            page,
            size: PAGE_SIZE,
            search: searchParams.search,
            orderBy: "purchaseTime",
            purchaseType: searchParams.purchaseType,
            platform: searchParams.platform,
            onlineType: searchParams.onlineType
        })
        const { data, error } = unwrapQueryResult(listResult)
        if(error) {
            return <InlineError error={error} />
        }
        const { list, total } = data
    
        return (
            <ListPageLayout searchParams={sp} breadcrumb={{ url: "/game/purchase" }} bar={<FilterBar searchParams={searchParams} />}
                filter={<FilterPanel searchParams={searchParams} />} content={<ContentRecords list={list} />} totalRecord={total}
                totalPage={Math.ceil(total / PAGE_SIZE)} currentPage={page} />
        )
    }

}

function FilterBar({ searchParams }: { searchParams: PurchaseListSearchParams }) {
    const view = searchParams.view ?? "records"
    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <Button variant="ghost" size="sm" pr="1">
                    {view === "summary" ? <><RiFundsBoxLine /> 项目总览</> : <><RiBillLine /> 消费记录</>}
                    <RiArrowDownSFill />
                </Button>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="records" asChild>
                            <NextLink href={staticHref({ searchParams: searchParams as Record<string, string>, key: "view", value: null, removePagination: true })}>
                                <Icon><RiBillLine /></Icon> 消费记录
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="summary" asChild>
                            <NextLink href={staticHref({ searchParams: searchParams as Record<string, string>, key: "view", value: "summary", removePagination: true })}>
                                <Icon><RiFundsBoxLine /></Icon> 项目总览
                            </NextLink>
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

function FilterPanel({ searchParams }: { searchParams: PurchaseListSearchParams }) {
    const view = searchParams.view ?? "records"
    
    const purchaseTypeItems = [{ label: "全部", value: "", color: "blue" }, ...SHOPPING_TYPE_SELECT_ITEMS]
    
    const platformItems = [{ label: "全部", value: "", color: "blue" }, ...PLATFORM_ITEMS]
    
    const onlineTypeItems = [{ label: "全部", value: "", color: "blue" }, ...ONLINE_TYPE_ITEMS]
    
    const summaryOrderItems = [
        { label: "按总消费", value: "", color: "blue" },
        { label: "按更新时间", value: "updateTime", color: "cyan" },
    ]
    
    return <>
        <SearchBox value={searchParams.search} searchParamName="search" placeholder="搜索项目…" />
        <SidePanel.FilterStack>
            {view === "records" && <SidePanel.FilterStackItem title="消费类型">
                <LinkGroupFilter items={purchaseTypeItems} searchParams={searchParams as Record<string, string>} searchParamName="purchaseType" />
            </SidePanel.FilterStackItem>}
            <SidePanel.FilterStackItem title="平台">
                <LinkGroupFilter items={platformItems} searchParams={searchParams as Record<string, string>} searchParamName="platform" />
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="联机类型">
                <LinkGroupFilter items={onlineTypeItems} searchParams={searchParams as Record<string, string>} searchParamName="onlineType" />
            </SidePanel.FilterStackItem>
            {view === "summary" && <SidePanel.FilterStackItem title="排序">
                <LinkGroupFilter items={summaryOrderItems} searchParams={searchParams as Record<string, string>} searchParamName="orderBy" />
            </SidePanel.FilterStackItem>}
        </SidePanel.FilterStack>
    </>
}

function ContentRecords({ list }: { list: PurchaseWithProjectSchema[] }) {
    return (
        <Table.Root size="sm">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader width="50px"></Table.ColumnHeader>
                    <Table.ColumnHeader>项目</Table.ColumnHeader>
                    <Table.ColumnHeader>类型</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">金额</Table.ColumnHeader>
                    <Table.ColumnHeader>消费时间</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {list.length === 0 ? (
                    <Table.Row>
                        <Table.Cell colSpan={5}>
                            <Text color="fg.muted" textAlign="center" py="6">暂无消费记录</Text>
                        </Table.Cell>
                    </Table.Row>
                ) : list.map((item) => (
                    <Table.Row key={item.id}>
                        <Table.Cell>
                            <Avatar.Root size="sm">
                                <Avatar.Fallback name={item.project.title} />
                                <Avatar.Image src={item.project.resources["avatar"]} />
                            </Avatar.Root>
                        </Table.Cell>
                        <Table.Cell>
                            <NextLink href={`/game/purchase/${item.project.id}`}>{item.project.title || "(未命名)"}</NextLink>
                        </Table.Cell>
                        <Table.Cell>{SHOPPING_TYPE_LABEL[item.purchaseType]}</Table.Cell>
                        <Table.Cell textAlign="right">{numbers.formatCurrency(item.cost)}</Table.Cell>
                        <Table.Cell color="fg.muted" fontSize="sm">{dates.toDailyText(item.purchaseTime)}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    )
}

function ContentSummary({ list }: { list: PurchaseSummaryWithProjectSchema[] }) {
    return (
        <Table.Root size="sm">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader width="50px"></Table.ColumnHeader>
                    <Table.ColumnHeader>项目</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">总笔数</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">累计消费</Table.ColumnHeader>
                    <Table.ColumnHeader>最近更新</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {list.length === 0 ? (
                    <Table.Row>
                        <Table.Cell colSpan={5}>
                            <Text color="fg.muted" textAlign="center" py="6">暂无汇总数据</Text>
                        </Table.Cell>
                    </Table.Row>
                ) : list.map((item) => (
                    <Table.Row key={item.projectId}>
                        <Table.Cell>
                            <Avatar.Root size="sm">
                                <Avatar.Fallback name={item.project.title} />
                                <Avatar.Image src={item.project.resources["avatar"]} />
                            </Avatar.Root>
                        </Table.Cell>
                        <Table.Cell>
                            <NextLink href={`/game/purchase/${item.project.id}`}>{item.project.title || "(未命名)"}</NextLink>
                        </Table.Cell>
                        <Table.Cell textAlign="right">{item.totalCount}</Table.Cell>
                        <Table.Cell textAlign="right">{numbers.formatCurrency(item.totalCost)}</Table.Cell>
                        <Table.Cell color="fg.muted" fontSize="sm">{dates.toDailyText(item.updateTime)}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    )
}
