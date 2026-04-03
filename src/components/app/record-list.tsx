import NextLink from "next/link"
import { RiArrowDownSFill, RiArrowRightLine, RiHistoryLine, RiPulseLine, RiTimelineView, RiTv2Line } from "react-icons/ri"
import { Avatar, Badge, Box, Button, Flex, Icon, Menu, Portal, Progress, Table, Text } from "@chakra-ui/react"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { LinkGroupFilter } from "@/components/server/filters"
import { RecordTimelineContent, TimelineFilterBar, TimelineFilterPanel, TimelineStateProvider } from "@/components/app/record-list-timeline"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { RECORD_STATUS_ITEMS, RecordStatus, VALUE_TO_RECORD_STATUS } from "@/constants/record"
import { RecordActivityListSchema, RecordHistoryListSchema } from "@/schemas/record"
import { listRecordActivity, listRecordHistory, listRecordTimeline } from "@/services/record-list"
import { FormattedDateTime } from "@/components/datetime"
import { resAvatar, staticHref } from "@/helpers/ui"
import { unwrapQueryResult } from "@/helpers/result"
import { getActivityText } from "@/helpers/data"

const HISTORY_PAGE_SIZE = 20
const ACTIVITY_PAGE_SIZE = 15

export type RecordListSearchParams = {
    page?: string
    search?: string
    view?: "activity" | "history" | "timeline"
    specialAttention?: "true" | "false"
    status?: RecordStatus
    progressKind?: "latest" | "first" | "rewatch"
    timelineScale?: string
    timelineGroup?: "true" | "false"
}

export async function RecordList(props: { searchParams: Promise<RecordListSearchParams>, type: ProjectType }) {
    const type = props.type
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1
    const view = searchParams.view ?? "activity"

    if(view === "history") {
        const result = await listRecordHistory({ type, page, size: HISTORY_PAGE_SIZE, search: searchParams.search, progressKind: searchParams.progressKind })
        const { data, error } = unwrapQueryResult(result)
        if(error) {
            return <InlineError error={error}/>
        }
        const { list, total } = data

        return (
            <ListPageLayout
                searchParams={searchParams}
                breadcrumb={{ url: `/${type.toLowerCase()}/record` }}
                bar={<FilterBar searchParams={searchParams}/>}
                filter={<FilterPanel searchParams={searchParams} type={type}/>}
                content={<ContentHistory list={list} type={type}/>}
                totalRecord={total}
                totalPage={Math.ceil(total / HISTORY_PAGE_SIZE)}
                currentPage={page}
            />
        )
    }else if(view === "activity") {
        const result = await listRecordActivity({ type, page, size: ACTIVITY_PAGE_SIZE, search: searchParams.search, specialAttention: searchParams.specialAttention, status: searchParams.status })
        const { data, error } = unwrapQueryResult(result)
        if(error) {
            return <InlineError error={error} />
        }
        const { list, total } = data
    
        return (
            <ListPageLayout
                searchParams={searchParams}
                breadcrumb={{ url: `/${type.toLowerCase()}/record` }}
                bar={<FilterBar searchParams={searchParams}/>}
                filter={<FilterPanel searchParams={searchParams} type={type}/>}
                content={<ContentActivity list={list}/>}
                totalRecord={total}
                totalPage={Math.ceil(total / ACTIVITY_PAGE_SIZE)}
                currentPage={page}
            />
        )
    }else if(view === "timeline") {
        const result = await listRecordTimeline({ type })
        const { data, error } = unwrapQueryResult(result)
        if(error) {
            return <InlineError error={error} />
        }
        const visibleDaysOnScreen = clampTimelineScaleDays(parseInt(searchParams.timelineScale ?? "180", 10))
        const groupByFollowType = searchParams.timelineGroup !== "false"
        return (
            <TimelineStateProvider>
                <ListPageLayout
                    searchParams={searchParams}
                    breadcrumb={{ url: `/${type.toLowerCase()}/record` }}
                    bar={<TimelineFilterBar searchParams={searchParams} />}
                    filter={<TimelineFilterPanel searchParams={searchParams} visibleDaysOnScreen={visibleDaysOnScreen} />}
                    content={<RecordTimelineContent rows={data} visibleDaysOnScreen={visibleDaysOnScreen} groupByFollowType={groupByFollowType}/>}
                />
            </TimelineStateProvider>
        )
    }else{
        return <NotFoundScreen message="无效的视图类型"/>
    }
}

function FilterBar({ searchParams }: { searchParams: RecordListSearchParams }) {
    const view = searchParams.view ?? "activity"
    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                {view === "history"? <Button variant="ghost" size="sm" pr="1"><RiHistoryLine/> 历史 <RiArrowDownSFill/></Button>
                : view === "activity" ? <Button variant="ghost" size="sm" pr="1"><RiPulseLine/> 动态 <RiArrowDownSFill/></Button>
                : <Button variant="ghost" size="sm" pr="1"><RiTimelineView /> 时间线 <RiArrowDownSFill /></Button>}
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="activity" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: null, removePagination: true })}>
                                <Icon><RiPulseLine/></Icon> 动态
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="history" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: "history", removePagination: true })}>
                                <Icon><RiHistoryLine/></Icon> 历史
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="timeline" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: "timeline", removePagination: true })}>
                                <Icon><RiTimelineView/></Icon> 时间线
                            </NextLink>
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

function FilterPanel({ searchParams, type }: { searchParams: RecordListSearchParams, type: ProjectType }) {
    const view = searchParams.view ?? "activity"
    const attentionItems = [
        { label: "全部", value: "", color: "blue" },
        { label: type === ProjectType.ANIME ? "已订阅" : "特别关注", value: "true", color: "yellow" },
        { label: type === ProjectType.ANIME ? "未订阅" : "未关注", value: "false", color: "gray" },
    ]
    const statusItems = [
        { label: "全部", value: "", color: "blue" },
        ...RECORD_STATUS_ITEMS.map(i => ({ label: i.label, value: i.value, color: i.color }))
    ]
    const progressKindItems = [
        { label: "全部", value: "", color: "blue" },
        { label: "最新进度", value: "latest", color: "cyan" },
        { label: "首次进度", value: "first", color: "green" },
        { label: "重看进度", value: "rewatch", color: "pink" },
    ]

    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search" />
            <SidePanel.FilterStack>
                {view === "activity" && <>
                    <SidePanel.FilterStackItem title={type === ProjectType.ANIME ? "订阅" : "关注"}>
                        <LinkGroupFilter items={attentionItems} searchParams={searchParams} searchParamName="specialAttention" />
                    </SidePanel.FilterStackItem>
                    <SidePanel.FilterStackItem title="状态">
                        <LinkGroupFilter items={statusItems} searchParams={searchParams} searchParamName="status" />
                    </SidePanel.FilterStackItem>
                </>}
                {view === "history" && <>
                    <SidePanel.FilterStackItem title="进度类型">
                        <LinkGroupFilter items={progressKindItems} searchParams={searchParams} searchParamName="progressKind" />
                    </SidePanel.FilterStackItem>
                </>}
            </SidePanel.FilterStack>
        </>
    )
}

function ContentActivity({ list }: { list: RecordActivityListSchema[] }) {
    return <Box>
        {list.map((item, idx) => <RecordActivityItem key={idx} item={item}/>)}
    </Box>
}

export function RecordActivityItem({ item }: { item: RecordActivityListSchema }) {
    const status = VALUE_TO_RECORD_STATUS[item.status]
    const progressPercent = item.totalEpisode && item.totalEpisode > 0 && item.watchedEpisode !== null
        ? Math.min(100, Math.floor((item.watchedEpisode / item.totalEpisode) * 100))
        : null
    const activityText = getActivityText(item.activityEvent)
    const type = item.project.type

    return (
        <Flex m="3" asChild>
            <NextLink href={`/${type.toLowerCase()}/record/${item.project.id}`}>
                <Avatar.Root mr="2">
                    <Avatar.Fallback name={item.project.title} />
                    <Avatar.Image src={resAvatar(item.project.resources)} />
                </Avatar.Root>
                <Box width="full">
                    <Flex lineHeight="38px" justify="space-between" align="center" gap="2">
                        <Flex align="center" gap="2" flexWrap="wrap">
                            <Text fontSize="md" fontWeight="500">{item.project.title}</Text>
                            {item.progressCount > 1 && <Badge colorPalette="pink" variant="outline">{item.progressCount}周目</Badge>}
                            <Badge colorPalette={status.color} variant="subtle">{status.label}</Badge>
                            {item.specialAttention && <Badge colorPalette="yellow" variant="outline">{type === ProjectType.ANIME ? "订阅中" : "特别关注"}</Badge>}
                        </Flex>
                        {item.activityTime ? (
                            <FormattedDateTime value={item.activityTime} variant="dailyText" color="fg.muted" fontSize="sm" />
                        ) : (
                            <Text color="fg.muted" fontSize="sm">暂无动态</Text>
                        )}
                    </Flex>
                    <Flex align="center" gap="2" color="fg.muted" fontSize="sm" justify="space-between">
                        <Text>{activityText}</Text>
                        <Box display="flex" alignItems="center" gap="2">
                            <Icon><RiTv2Line /></Icon>
                            <Text>
                                {item.totalEpisode !== null
                                    ? `已看 ${item.watchedEpisode ?? 0} / ${item.totalEpisode}`
                                    : `已记录 ${item.progressCount} 段进度`}
                            </Text>
                        </Box>
                    </Flex>
                    {progressPercent !== null && <Progress.Root mt="2" colorPalette="blue" value={progressPercent} size="xs"><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>}
                </Box>
            </NextLink>
        </Flex>
    )
}

function ContentHistory({ list, type }: { list: RecordHistoryListSchema[], type: ProjectType }) {
    return <Table.Root size="sm">
        <Table.Header>
            <Table.Row>
                <Table.ColumnHeader width="50px"></Table.ColumnHeader>
                <Table.ColumnHeader>标题</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">经历时间</Table.ColumnHeader>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {list.map((item, idx) => {
                const showStart = item.startTime && (!item.endTime || !sameLocalCalendarDay(item.startTime, item.endTime))
                return (
                    <Table.Row key={idx}>
                    <Table.Cell>
                        <Avatar.Root size="sm" shape="rounded">
                            <Avatar.Fallback name={item.project.title} />
                            <Avatar.Image src={resAvatar(item.project.resources)} />
                        </Avatar.Root>
                    </Table.Cell>
                    <Table.Cell>
                        <Flex align="center" gap="2" flexWrap="wrap">
                            <NextLink href={`/${type.toLowerCase()}/record/${item.project.id}`}>{item.project.title}</NextLink>
                            {item.ordinal > 1 && <Badge colorPalette="pink" variant="outline">{item.ordinal}周目</Badge>}
                        </Flex>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                        <Box>
                            {showStart && <FormattedDateTime value={item.startTime} variant="dateOnly" display="inline" />}
                            {showStart && <Icon display={{base: "none", sm: "inline"}} mx="2"><RiArrowRightLine/></Icon>}
                            <FormattedDateTime value={item.endTime} variant="dateOnly" display={{base: "block", sm: "inline"}} emptyLabel="" />
                        </Box>
                    </Table.Cell>
                </Table.Row>
                )
            })}
        </Table.Body>
    </Table.Root>
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function clampTimelineScaleDays(n: number): number {
    if(Number.isNaN(n) || n < 7) return 180
    return Math.min(730, Math.max(7, Math.round(n)))
}

