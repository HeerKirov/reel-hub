import NextLink from "next/link"
import { RiArrowDownSFill, RiArrowRightLine, RiHistoryLine, RiPulseLine, RiTimelineView, RiTv2Line } from "react-icons/ri"
import { Avatar, Badge, Box, Button, Flex, Icon, Menu, Portal, Progress, Table, Text } from "@chakra-ui/react"
import { ListPageLayout } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { RecordTimelineContent, TimelineFilterBar, TimelineFilterPanel, TimelineStateProvider } from "@/components/app/record-list-timeline"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { VALUE_TO_RECORD_STATUS } from "@/constants/record"
import { RecordActivityListSchema, RecordHistoryListSchema } from "@/schemas/record"
import { listRecordActivity, listRecordHistory, listRecordTimeline } from "@/services/record-list"
import { dates } from "@/helpers/primitive"
import { staticHref } from "@/helpers/ui"
import { unwrapQueryResult } from "@/helpers/result"

export type RecordListSearchParams = {
    page?: string
    search?: string
    view?: "activity" | "history" | "timeline"
    timelineScale?: string
    timelineGroup?: "true" | "false"
}

export async function RecordList(props: { searchParams: Promise<RecordListSearchParams>, type: ProjectType }) {
    const type = props.type
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1
    const view = searchParams.view ?? "activity"

    if(view === "history") {
        const result = await listRecordHistory({ type, page, size: 15, search: searchParams.search })
        const { data, error } = unwrapQueryResult(result)
        if(error) {
            return <InlineError error={error} />
        }
        const { list, total } = data

        return (
            <ListPageLayout
                searchParams={searchParams}
                breadcrumb={{ url: `/${type.toLowerCase()}/record` }}
                bar={<FilterBar searchParams={searchParams} />}
                filter={<FilterPanel searchParams={searchParams} />}
                content={<ContentHistory list={list} type={type} />}
                totalRecord={total}
                totalPage={Math.ceil(total / 15)}
                currentPage={page}
            />
        )
    }else if(view === "activity") {
        const result = await listRecordActivity({ type, page, size: 15, search: searchParams.search })
        const { data, error } = unwrapQueryResult(result)
        if(error) {
            return <InlineError error={error} />
        }
        const { list, total } = data
    
        return (
            <ListPageLayout
                searchParams={searchParams}
                breadcrumb={{ url: `/${type.toLowerCase()}/record` }}
                bar={<FilterBar searchParams={searchParams} />}
                filter={<FilterPanel searchParams={searchParams} />}
                content={<ContentActivity list={list} type={type} />}
                totalRecord={total}
                totalPage={Math.ceil(total / 15)}
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
                    content={<RecordTimelineContent rows={data} visibleDaysOnScreen={visibleDaysOnScreen} groupByFollowType={groupByFollowType} />}
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
                {view === "history"? <Button variant="ghost" size="sm" pr="1"><RiHistoryLine /> 历史 <RiArrowDownSFill /></Button>
                : view === "activity" ? <Button variant="ghost" size="sm" pr="1"><RiPulseLine /> 动态 <RiArrowDownSFill /></Button>
                : <Button variant="ghost" size="sm" pr="1"><RiTimelineView /> 时间线 <RiArrowDownSFill /></Button>}
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="activity" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: null, removePagination: true })}>
                                <Icon><RiPulseLine /></Icon> 动态
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="history" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: "history", removePagination: true })}>
                                <Icon><RiHistoryLine /></Icon> 历史
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="timeline" asChild>
                            <NextLink href={staticHref({ searchParams, key: "view", value: "timeline", removePagination: true })}>
                                <Icon><RiTimelineView /></Icon> 时间线
                            </NextLink>
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

function FilterPanel({ searchParams }: { searchParams: RecordListSearchParams }) {
    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search" />
        </>
    )
}

function ContentActivity({ list, type }: { list: RecordActivityListSchema[], type: ProjectType }) {
    return <Box>
        {list.map((item, idx) => {
            const status = VALUE_TO_RECORD_STATUS[item.status]
            const progressPercent = item.totalEpisode && item.totalEpisode > 0 && item.watchedEpisode !== null
                ? Math.min(100, Math.floor((item.watchedEpisode / item.totalEpisode) * 100))
                : null
            const activityText = getActivityText(item.activityEvent)
            return (
                <Flex key={idx} m="3" asChild>
                    <NextLink href={`/${type.toLowerCase()}/record/${item.project.id}`}>
                        <Avatar.Root mr="2">
                            <Avatar.Fallback name={item.project.title} />
                            <Avatar.Image src={item.project.resources["avatar"]} />
                        </Avatar.Root>
                        <Box width="full">
                            <Flex lineHeight="38px" justify="space-between" align="center" gap="2">
                                <Flex align="center" gap="2" flexWrap="wrap">
                                    <Text fontSize="md" fontWeight="500">{item.project.title}</Text>
                                    {item.progressCount > 1 && <Badge colorPalette="pink" variant="outline">{item.progressCount}周目</Badge>}
                                    <Badge colorPalette={status.color} variant="subtle">{status.label}</Badge>
                                    {item.specialAttention && <Badge colorPalette="yellow" variant="outline">订阅中</Badge>}
                                </Flex>
                                <Text color="fg.muted" fontSize="sm">{item.activityTime ? dates.toDailyText(item.activityTime) : "暂无动态"}</Text>
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
                            {progressPercent !== null && <Progress.Root mt="2" value={progressPercent} size="sm"><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>}
                        </Box>
                    </NextLink>
                </Flex>
            )
        })}
    </Box>
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
                const startTime = item.startTime ? dates.toDateText(item.startTime) : null
                const endTime = item.endTime ? dates.toDateText(item.endTime) : null
                return (
                    <Table.Row key={idx}>
                    <Table.Cell>
                        <Avatar.Root size="sm">
                            <Avatar.Fallback name={item.project.title} />
                            <Avatar.Image src={item.project.resources["avatar"]} />
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
                            {(startTime && startTime !== endTime) ? startTime : null}
                            {(startTime && startTime !== endTime) && <Icon display={{base: "none", sm: "inline"}} mx="2"><RiArrowRightLine/></Icon>}
                            <Text display={{base: "block", sm: "inline"}}>{endTime}</Text>
                        </Box>
                    </Table.Cell>
                </Table.Row>
                )
            })}
        </Table.Body>
    </Table.Root>
}

function clampTimelineScaleDays(n: number): number {
    if(Number.isNaN(n) || n < 7) return 180
    return Math.min(730, Math.max(7, Math.round(n)))
}

function getActivityText(activityEvent: Record<string, unknown>): string {
    const type = activityEvent.type
    if(type === "CREATE_RECORD") return "创建了记录"
    if(type === "CREATE_PROGRESS") return "新建了进度"
    if(type === "EDIT_PROGRESS") return "编辑了进度"
    if(type === "WATCH_EPISODE") {
        const episodeNum = activityEvent.episodeNum
        return typeof episodeNum === "number" ? `看到第 ${episodeNum} 话` : "推进了进度"
    }
    return "有新的动态"
}
