import type { Metadata } from "next"
import { Avatar, Badge, Box, Flex, HStack, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { Tooltip } from "@/components/ui/tooltip"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { LinkGroupFilter } from "@/components/server/filters"
import { SearchBox } from "@/components/filters"
import {
    RECORD_SUBSCRIPTION_ANIME_MODE, RECORD_SUBSCRIPTION_ANIME_ORDER, RecordSubscriptionAnimeListSchema
} from "@/schemas/record"
import { listRecordSubscriptionAnime } from "@/services/record-list"
import { unwrapQueryResult } from "@/helpers/result"
import { InlineError } from "@/components/app/inline-error"
import { SubscriptionAnimeRowNextButton } from "./components"
import { formatNextPublishLine } from "./helpers"

export const metadata: Metadata = {
    title: "订阅"
}

export type SubscriptionAnimePageSearchParams = Record<string, string | string[] | undefined>

function firstQuery(v: string | string[] | undefined): string | undefined {
    if (v === undefined) return undefined
    return Array.isArray(v) ? v[0] : v
}

function normalizeSearchParams(raw: SubscriptionAnimePageSearchParams) {
    return {
        search: firstQuery(raw.search),
        mode: firstQuery(raw.mode),
        order: firstQuery(raw.order),
        orderDirection: firstQuery(raw.orderDirection)
    }
}

const MODE_FILTER_ITEMS = [
    { label: "活跃", value: "", color: "blue" },
    { label: "有存货", value: "watchable", color: "blue" },
    { label: "更新中", value: "updating", color: "blue" },
    { label: "已完结", value: "completed", color: "blue" },
    { label: "已搁置", value: "shelve", color: "blue" }
] as const

const ORDER_FILTER_ITEMS = [
    { label: "周历", value: "", color: "blue" },
    { label: "即将更新", value: "update_soon", color: "blue" },
    { label: "订阅时间", value: "subscription_time", color: "blue" }
] as const

const DIRECTION_FILTER_ITEMS = [
    { label: "升序", value: "", color: "blue" },
    { label: "降序", value: "desc", color: "blue" }
] as const

function buildSubscriptionFilter(sp: ReturnType<typeof normalizeSearchParams>) {
    const mode =
        sp.mode && (RECORD_SUBSCRIPTION_ANIME_MODE as readonly string[]).includes(sp.mode)
            ? (sp.mode as (typeof RECORD_SUBSCRIPTION_ANIME_MODE)[number])
            : undefined
    const order =
        sp.order && (RECORD_SUBSCRIPTION_ANIME_ORDER as readonly string[]).includes(sp.order)
            ? (sp.order as (typeof RECORD_SUBSCRIPTION_ANIME_ORDER)[number])
            : undefined
    const orderDirection = sp.orderDirection === "desc" ? "desc" as const : sp.orderDirection === "asc" ? "asc" as const : undefined
    return { search: sp.search, mode, order, orderDirection }
}

export default async function AnimeSubscriptionPage(props: { searchParams: Promise<SubscriptionAnimePageSearchParams> }) {
    const raw = await props.searchParams
    const sp = normalizeSearchParams(raw)
    const filter = buildSubscriptionFilter(sp)
    const result = await listRecordSubscriptionAnime(filter)
    const { data, error } = unwrapQueryResult(result)
    if (error) {
        return <InlineError error={error} />
    }
    const list = data

    const layoutSearchParams: Record<string, string> = {}
    if (sp.search) layoutSearchParams.search = sp.search
    if (sp.mode && sp.mode !== "active") layoutSearchParams.mode = sp.mode
    if (sp.order && sp.order !== "weekly_calendar") layoutSearchParams.order = sp.order
    if (sp.orderDirection && sp.orderDirection !== "asc") layoutSearchParams.orderDirection = sp.orderDirection

    return (
        <ListPageLayout
            searchParams={layoutSearchParams}
            breadcrumb={{ url: "/anime/subscription" }}
            filter={<FilterPanel searchParams={layoutSearchParams} />}
            content={<Content list={list} />}
            totalRecord={list.length}
        />
    )
}

function FilterPanel({ searchParams }: { searchParams: Record<string, string> }) {
    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search" />
            <SidePanel.FilterStack>
                <SidePanel.FilterStackItem title="范围" asChild>
                    <LinkGroupFilter items={[...MODE_FILTER_ITEMS]} searchParams={searchParams} searchParamName="mode" />
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title="排序" asChild>
                    <LinkGroupFilter items={[...ORDER_FILTER_ITEMS]} searchParams={searchParams} searchParamName="order" />
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title="顺序" asChild>
                    <LinkGroupFilter
                        items={[...DIRECTION_FILTER_ITEMS]}
                        searchParams={searchParams}
                        searchParamName="orderDirection"
                    />
                </SidePanel.FilterStackItem>
            </SidePanel.FilterStack>
        </>
    )
}

function Content({ list }: { list: RecordSubscriptionAnimeListSchema[] }) {
    if (list.length === 0) {
        return (
            <Box m="3" color="fg.muted">
                <Text>没有订阅</Text>
            </Box>
        )
    }
    return (
        <Box>
            {list.map(item => (
                <SubscriptionAnimeRow key={item.recordId} item={item} />
            ))}
        </Box>
    )
}

function SubscriptionAnimeRow({ item }: { item: RecordSubscriptionAnimeListSchema }) {
    const hasBacklog = item.watchedEpisode !== null && item.watchedEpisode < item.publishedEpisode

    return (
        <Flex p="3" gap="3" align="stretch" borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="border">
            <NextLink href={`/anime/record/${item.project.id}`}>
                <Avatar.Root flexShrink={0} size="2xl" shape="rounded">
                    <Avatar.Fallback name={item.project.title} />
                    <Avatar.Image src={item.project.resources["avatar"]} />
                </Avatar.Root>
            </NextLink>
            <Flex gap="2" align="flex-start" width="full" justify="space-between" direction="column">
                <NextLink href={`/anime/record/${item.project.id}`}>
                    <Text fontSize="md" fontWeight="500" lineHeight="tall">
                        {item.project.title}
                    </Text>
                </NextLink>
                {item.nextPublishPlanItem && <Badge colorPalette="teal" variant="subtle" whiteSpace="normal" textAlign="right" maxW="100%">
                    {formatNextPublishLine(item.nextPublishPlanItem)}
                </Badge>}
            </Flex>
            <Flex gap="3" align="flex-end" flex="1 0 auto" justifyContent="space-between" direction="column">
                <EpisodeTriple watched={item.watchedEpisode} published={item.publishedEpisode} total={item.totalEpisode} />
                {hasBacklog && <SubscriptionAnimeRowNextButton projectId={item.project.id} watched={item.watchedEpisode!} />}
        </Flex>
        </Flex>
    )
}

function EpisodeTriple({ watched, published, total }: { watched: number | null, published: number, total: number }) {
    return (
        <Tooltip content={published < total ? "已看完 / 已发布 / 总集数" : "已看完 / 总集数"}>
            <HStack gap="0" flexShrink={0}>
                <Box borderWidth="1px" borderColor="border" px="2" py="0.5" rounded="sm">
                    {watched ?? "—"}
                </Box>
                <Text px="1" color="fg.muted" fontWeight="bold">/</Text>
                {published < total && <>
                    <Box borderWidth="1px 1px 1px 0" borderColor="border" px="2" py="0.5" rounded="sm" background="teal.subtle">
                        {published}
                    </Box>
                    <Text px="1" color="fg.muted" fontWeight="bold">/</Text>
                </>}
                <Box borderWidth="1px 1px 1px 0" borderColor="border" px="2" py="0.5" rounded="sm" background="bg.muted">
                    {total}
                </Box>
            </HStack>
        </Tooltip>
    )
}

