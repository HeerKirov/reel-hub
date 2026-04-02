"use client"

import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { RiArrowDownSFill, RiHistoryLine, RiPulseLine, RiTimelineView } from "react-icons/ri"
import { Badge, Box, Button, Flex, Icon, Menu, Portal, SegmentGroup, Text } from "@chakra-ui/react"
import { SidePanel } from "@/components/server/layout"
import { LinkOptionFilter } from "@/components/server/filters"
import { TimelineCanvas, type TimelineItem } from "@/components/app/record-timeline"
import type { RecordListSearchParams } from "@/components/app/record-list"
import { RecordStatus, VALUE_TO_FOLLOW_TYPE } from "@/constants/record"
import type { RecordTimelineItemSchema } from "@/schemas/record"
import { dates } from "@/helpers/primitive"
import { resAvatar, staticHref } from "@/helpers/ui"

type TimelineContextValue = {
    visibleRange: { newerAt: Date, olderAt: Date } | null
    setVisibleRange: (r: { newerAt: Date, olderAt: Date } | null) => void
    registerScrollToToday: (fn: (() => void) | null) => void
    scrollToToday: () => void
}

const TimelineContext = createContext<TimelineContextValue | null>(null)

export function useTimelineContext(): TimelineContextValue {
    const ctx = useContext(TimelineContext)
    if(!ctx) throw new Error("useTimelineContext must be used within TimelineStateProvider")
    return ctx
}

export function TimelineStateProvider({ children }: { children: React.ReactNode }) {
    const [visibleRange, setVisibleRange] = useState<{ newerAt: Date, olderAt: Date } | null>(null)
    const scrollRef = useRef<(() => void) | null>(null)
    const registerScrollToToday = useCallback((fn: (() => void) | null) => {
        scrollRef.current = fn
    }, [])
    const scrollToToday = useCallback(() => {
        scrollRef.current?.()
    }, [])
    const value = useMemo(() => ({
        visibleRange,
        setVisibleRange,
        registerScrollToToday,
        scrollToToday,
    }), [visibleRange, registerScrollToToday, scrollToToday])
    return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

const SCALE_OPTIONS: { days: number, label: string }[] = [
    { days: 7, label: "7 天" },
    { days: 14, label: "14 天" },
    { days: 30, label: "30 天" },
    { days: 90, label: "90 天" },
    { days: 180, label: "180 天" },
    { days: 365, label: "1 年" },
]

const COLOR_PALETTE = ["blue", "purple", "teal", "cyan", "green", "orange", "pink", "red", "yellow", "lime"]

export function TimelineFilterBar({ searchParams }: { searchParams: RecordListSearchParams }) {
    const { visibleRange } = useTimelineContext()
    return (
        <Flex align="center" gap="2" flex="1" minW={0}>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <Button variant="ghost" size="sm" pr="1" flexShrink={0}><RiTimelineView /> 时间线 <RiArrowDownSFill /></Button>
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
            <Box display={{ base: "block", md: "none" }} flex="1" minW={0} fontSize="xs" color="fg.muted" lineHeight="1.25">
                {visibleRange ? <>
                    <Text truncate title={dates.format(visibleRange.newerAt, "dateOnly")}>{dates.format(visibleRange.newerAt, "dateOnly")}</Text>
                    <Text truncate title={dates.format(visibleRange.olderAt, "dateOnly")}>{dates.format(visibleRange.olderAt, "dateOnly")}</Text>
                </> : <Text>—</Text>}
            </Box>
        </Flex>
    )
}

export function TimelineFilterPanel({ searchParams, visibleDaysOnScreen }: {searchParams: RecordListSearchParams, visibleDaysOnScreen: number}) {
    const { visibleRange, scrollToToday } = useTimelineContext()
    const router = useRouter()
    const clientSearchParams = useSearchParams()

    return (
        <SidePanel.FilterStack>
            <SidePanel.FilterStackItem title="可视范围">
                {visibleRange ? <Flex direction="column" align="flex-start" gap="1">
                    <Badge variant="subtle" fontSize="xs" maxW="full" whiteSpace="normal">{dates.format(visibleRange.newerAt, "dateOnly")}</Badge>
                    <Badge variant="subtle" fontSize="xs" maxW="full" whiteSpace="normal">{dates.format(visibleRange.olderAt, "dateOnly")}</Badge>
                </Flex> : <Badge variant="subtle" fontSize="xs">—</Badge>}
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="">
                <Button size="xs" variant="outline" onClick={() => scrollToToday()}>回到今天</Button>
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="比例尺">
                <SegmentGroup.Root
                    size="sm" orientation="vertical"
                    value={`${visibleDaysOnScreen}`}
                    onValueChange={(details) => {
                        if(!details.value) return
                        const days = parseInt(details.value, 10)
                        if(Number.isNaN(days)) return
                        const p = new URLSearchParams(clientSearchParams.toString())
                        p.set("timelineScale", `${days}`)
                        router.push(`?${p.toString()}`)
                    }}
                >
                    <SegmentGroup.Indicator />
                    {SCALE_OPTIONS.map((opt) => (
                        <SegmentGroup.Item key={opt.days} value={`${opt.days}`}>
                            <SegmentGroup.ItemText>{opt.label}</SegmentGroup.ItemText>
                            <SegmentGroup.ItemHiddenInput />
                        </SegmentGroup.Item>
                    ))}
                </SegmentGroup.Root>
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="分组">
                <LinkOptionFilter label="进度类型分组" color="blue" searchParams={searchParams} searchParamName="timelineGroup" defaultValue={true}/>
            </SidePanel.FilterStackItem>
        </SidePanel.FilterStack>
    )
}

export function RecordTimelineContent({
    rows,
    visibleDaysOnScreen,
    groupByFollowType,
}: {
    rows: RecordTimelineItemSchema[]
    visibleDaysOnScreen: number
    groupByFollowType: boolean
}) {
    const { setVisibleRange, registerScrollToToday } = useTimelineContext()
    const items = useMemo(() => buildTimelineItemsFromRecordTimelineRows(rows), [rows])
    return (
        <TimelineCanvas
            items={items}
            visibleDaysOnScreen={visibleDaysOnScreen}
            groupByFollowType={groupByFollowType}
            onVisibleRangeChange={setVisibleRange}
            registerScrollToToday={registerScrollToToday}
        />
    )
}

function buildTimelineItemsFromRecordTimelineRows(rows: RecordTimelineItemSchema[]): TimelineItem[] {
    return rows.map((item) => {
        const followTypeLabel = item.followType ? VALUE_TO_FOLLOW_TYPE[item.followType].label : null
        const summary = item.ordinal >= 2
            ? `${item.ordinal}周目`
            : (followTypeLabel ?? "")
        return {
            id: `${item.project.id}-${item.ordinal}`,
            title: item.project.title,
            summary,
            avatar: resAvatar(item.project.resources),
            startAt: item.startTime,
            endAt: item.endTime,
            ongoing: item.status === RecordStatus.WATCHING,
            href: `/${item.project.type.toLowerCase()}/record/${item.project.id}`,
            color: pickColor(item.project.id),
            followType: item.followType,
        }
    })
}

function pickColor(seed: string): string {
    let hash = 0
    for(let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i)
        hash |= 0
    }
    return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}
