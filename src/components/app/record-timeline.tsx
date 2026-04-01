"use client"

import NextLink from "next/link"
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Badge, Box, Button, Drawer, Flex, HoverCard, Image, Portal, Text } from "@chakra-ui/react"
import { dates } from "@/helpers/primitive"
import type { FollowType } from "@/constants/record"
import emptyCover from "@/assets/empty.svg"

export type TimelineItem = {
    id: string
    title: string
    summary: string
    avatar: string | null
    startAt: Date
    endAt: Date | null
    ongoing: boolean
    href: string
    color: string
    followType: FollowType | null
}

type PositionedItem = {
    data: TimelineItem
    lane: number
    startAt: Date
    endAt: Date
}

type TimelineTick = {
    at: Date
    label: string
}

type VisibleTimeRange = {
    newerAt: Date
    olderAt: Date
    viewTop: number
    viewBottom: number
    renderTop: number
    renderBottom: number
}

type VisibleTimelineItem = PositionedItem & {
    startY: number
    endY: number
    lineTop: number
    lineHeight: number
    showStartEndpoint: boolean
    showEndEndpoint: boolean
    clippedTop: boolean
    clippedBottom: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000
const BAR_WIDTH = 46
const BAR_GAP = 6
const AXIS_GUTTER = 90
const STROKE_OUTER = 10
const ENDPOINT_OUTER = 22
const ENDPOINT_INNER = 14
const VIEWPORT_HEIGHT = "clamp(72vh, calc(100vh - 210px), 88vh)"
const VIEWPORT_BUFFER_DAYS = 14
const LAYOUT_BUFFER_DAYS = 120
const RENDER_OVERSCAN_PX = 120
const PX_PER_DAY_FALLBACK = 1.8
const PX_PER_DAY_MIN = 0.12
const PX_PER_DAY_MAX = 240
const FOLLOW_TYPE_LANE_ORDER: Record<FollowType, number> = {
    FOLLOW: 0,
    CATCH_UP: 1,
    REWATCH: 2,
}

export function TimelineCanvas(props: {
    items: TimelineItem[]
    visibleDaysOnScreen: number
    groupByFollowType?: boolean
    onVisibleRangeChange?: (r: { newerAt: Date, olderAt: Date }) => void
    registerScrollToToday?: (fn: (() => void) | null) => void
}) {
    const {
        items,
        visibleDaysOnScreen,
        groupByFollowType = false,
        onVisibleRangeChange,
        registerScrollToToday,
    } = props

    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [viewportHeight, setViewportHeight] = useState(0)
    const [viewportWidth, setViewportWidth] = useState(0)
    const [initialized, setInitialized] = useState(false)
    const [mobilePreviewItem, setMobilePreviewItem] = useState<VisibleTimelineItem | null>(null)
    const prevVisibleDaysRef = useRef<number | null>(null)

    const bounds = useTimelineBounds(items)

    const pxPerDay = useMemo(() => {
        if(viewportHeight <= 0) return PX_PER_DAY_FALLBACK
        const raw = viewportHeight / Math.max(1, visibleDaysOnScreen)
        return Math.max(PX_PER_DAY_MIN, Math.min(PX_PER_DAY_MAX, raw))
    }, [viewportHeight, visibleDaysOnScreen])

    const dateToY = useCallback((date: Date, globalMaxAt: Date) => {
        return diffDays(globalMaxAt, date) * pxPerDay
    }, [pxPerDay])

    const yToDate = useCallback((y: number, globalMaxAt: Date) => {
        return new Date(globalMaxAt.getTime() - (y / pxPerDay) * DAY_MS)
    }, [pxPerDay])

    const totalDays = Math.max(1, diffDays(bounds.globalMaxAt, bounds.globalMinAt))
    const totalHeight = Math.ceil(totalDays * pxPerDay)

    useLayoutEffect(() => {
        const element = scrollerRef.current
        if(!element) return
        const measure = () => {
            setViewportHeight(element.clientHeight)
            setViewportWidth(element.clientWidth)
        }
        measure()
        const observer = new ResizeObserver(() => measure())
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    useLayoutEffect(() => {
        const element = scrollerRef.current
        if(!element || initialized || viewportHeight <= 0) return
        const todayY = dateToY(new Date(), bounds.globalMaxAt)
        const desired = Math.max(0, Math.min(totalHeight - viewportHeight, todayY - viewportHeight * 0.35))
        element.scrollTop = desired
        setScrollTop(desired)
        setInitialized(true)
    }, [initialized, viewportHeight, totalHeight, bounds.globalMaxAt, dateToY])

    useEffect(() => {
        const element = scrollerRef.current
        if(!element || viewportHeight <= 0 || !initialized) return
        if(prevVisibleDaysRef.current === null) {
            prevVisibleDaysRef.current = visibleDaysOnScreen
            return
        }
        if(prevVisibleDaysRef.current === visibleDaysOnScreen) return
        prevVisibleDaysRef.current = visibleDaysOnScreen
        const centerY = element.scrollTop + viewportHeight / 2
        const centerDate = yToDate(centerY, bounds.globalMaxAt)
        const newY = dateToY(centerDate, bounds.globalMaxAt)
        const nextTop = Math.max(0, Math.min(totalHeight - viewportHeight, newY - viewportHeight / 2))
        element.scrollTop = nextTop
        setScrollTop(nextTop)
    }, [visibleDaysOnScreen, initialized, viewportHeight, totalHeight, bounds.globalMaxAt, dateToY, yToDate])

    const timelineTicks = useTimelineTicks(bounds.globalMinAt, bounds.globalMaxAt, visibleDaysOnScreen)

    const visibleTimeRange = useVisibleTimeRange(scrollTop, viewportHeight, bounds.globalMaxAt, yToDate)

    useEffect(() => {
        onVisibleRangeChange?.({ newerAt: visibleTimeRange.newerAt, olderAt: visibleTimeRange.olderAt })
    }, [visibleTimeRange.newerAt, visibleTimeRange.olderAt, onVisibleRangeChange])

    const visibleItems = useVisibleTimelineItems(items, bounds.globalMaxAt, visibleTimeRange, groupByFollowType, dateToY)

    const maxLane = visibleItems.reduce((max, i) => Math.max(max, i.lane), 0)
    const effectiveAxisGutter = Math.max(52, Math.min(AXIS_GUTTER, Math.floor(viewportWidth * 0.2)))
    const effectiveBarWidth = viewportWidth > 0 && viewportWidth < 420 ? 34 : BAR_WIDTH
    const effectiveBarGap = viewportWidth > 0 && viewportWidth < 420 ? 4 : BAR_GAP
    const canvasWidth = effectiveAxisGutter + (maxLane + 1) * (effectiveBarWidth + effectiveBarGap) + 32
    const ready = viewportHeight > 0 && initialized
    const isCoarsePointer = useIsCoarsePointer()
    const enableTouchPreview = isCoarsePointer

    const scrollToToday = useCallback(() => {
        const element = scrollerRef.current
        if(!element) return
        const todayY = dateToY(new Date(), bounds.globalMaxAt)
        const desired = Math.max(0, Math.min(totalHeight - viewportHeight, todayY - viewportHeight * 0.35))
        element.scrollTo({ top: desired, behavior: "smooth" })
    }, [dateToY, bounds.globalMaxAt, totalHeight, viewportHeight])

    useEffect(() => {
        registerScrollToToday?.(scrollToToday)
        return () => registerScrollToToday?.(null)
    }, [registerScrollToToday, scrollToToday])

    return <Box w="full" minW={0}>
        <Box
            ref={scrollerRef}
            w="full"
            minW={0}
            overflowY="auto"
            overflowX="auto"
            h={VIEWPORT_HEIGHT}
            borderWidth="1px"
            rounded="md"
            bg="bg.panel"
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
            {!ready && <Box h={VIEWPORT_HEIGHT} />}
            {ready && <Box position="relative" w="full" minW={`${canvasWidth}px`} h={`${totalHeight}px`}>
                <Box position="absolute" left={`${effectiveAxisGutter - 1}px`} top="0" bottom="0" w="2px" bg="fg.muted" opacity={0.35} />

                {timelineTicks.map((tick) => (
                    <TimelineTickLine
                        key={tick.at.toISOString()}
                        tick={tick}
                        visibleTimeRange={visibleTimeRange}
                        globalMaxAt={bounds.globalMaxAt}
                        dateToY={dateToY}
                    />
                ))}

                {visibleItems.map((item) => {
                    const left = effectiveAxisGutter + item.lane * (effectiveBarWidth + effectiveBarGap)
                    return <TimelineProgressBarItem
                        key={item.data.id}
                        item={item}
                        left={left}
                        width={effectiveBarWidth}
                        enableTouchPreview={enableTouchPreview}
                        onOpenMobilePreview={setMobilePreviewItem}
                    />
                })}
            </Box>}
        </Box>
        <Drawer.Root
            placement="bottom"
            open={mobilePreviewItem !== null}
            onOpenChange={(e) => {
                if(!e.open) setMobilePreviewItem(null)
            }}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>{mobilePreviewItem?.data.title ?? "进度详情"}</Drawer.Title>
                        </Drawer.Header>
                        <Drawer.Body>
                            {mobilePreviewItem && <Flex direction="column" gap="2">
                                <Flex gap="3" align="flex-start">
                                    <Box
                                        w="56px"
                                        h="56px"
                                        rounded="md"
                                        bg="bg.muted"
                                        overflow="hidden"
                                        flexShrink={0}
                                        borderWidth="1px"
                                    >
                                        <Image src={mobilePreviewItem.data.avatar ?? emptyCover.src} alt={mobilePreviewItem.data.title} w="full" h="full" objectFit="cover" />
                                    </Box>
                                    <Flex direction="column" gap="2" minW={0}>
                                        <Text fontWeight="600" lineClamp={2}>{mobilePreviewItem.data.title}</Text>
                                        <Text fontSize="sm" color="fg.muted" lineHeight="1.3">
                                            {dates.toDateText(mobilePreviewItem.startAt)} - {dates.toDateText(mobilePreviewItem.endAt)}
                                        </Text>
                                        <Flex align="center" gap="2" flexWrap="wrap">
                                            <Badge colorPalette={mobilePreviewItem.data.color} variant="subtle">
                                                {mobilePreviewItem.data.ongoing ? "进行中" : "已结束"}
                                            </Badge>
                                            {mobilePreviewItem.data.summary && (
                                                <Badge alignSelf="flex-start" variant="outline" colorPalette={mobilePreviewItem.data.color}>
                                                    {mobilePreviewItem.data.summary}
                                                </Badge>
                                            )}
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Button asChild size="sm" mt="1">
                                    <NextLink href={mobilePreviewItem.data.href}>查看详情</NextLink>
                                </Button>
                            </Flex>}
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    </Box>
}

const TimelineTickLine = memo(function TimelineTickLine(props: {
    tick: TimelineTick
    visibleTimeRange: VisibleTimeRange
    globalMaxAt: Date
    dateToY: (date: Date, globalMaxAt: Date) => number
}) {
    const top = props.dateToY(props.tick.at, props.globalMaxAt)
    if(top < props.visibleTimeRange.renderTop - 30 || top > props.visibleTimeRange.renderBottom + 30) return null
    return <Box position="absolute" left="0" right="0" top={`${top}px`} borderTopWidth="1px" borderColor="border.muted" opacity={0.8}>
        <Text position="absolute" left="2" top="0" transform="translateY(-50%)" fontSize="xs" color="fg.muted" whiteSpace="nowrap">
            {props.tick.label}
        </Text>
    </Box>
})

const TimelineProgressBarItem = memo(function TimelineProgressBarItem(props: {
    item: VisibleTimelineItem
    left: number
    width: number
    enableTouchPreview: boolean
    onOpenMobilePreview: (item: VisibleTimelineItem) => void
}) {
    const { item } = props
    const info = `${dates.toDateText(item.startAt)} - ${dates.toDateText(item.endAt)}`
    if(props.enableTouchPreview) {
        return <Box
            position="absolute"
            left={`${props.left}px`}
            top={`${item.lineTop}px`}
            w={`${props.width}px`}
            h={`${item.lineHeight}px`}
            overflow="visible"
            cursor="pointer"
            onPointerUp={(e) => {
                if(e.pointerType === "touch") {
                    e.preventDefault()
                    props.onOpenMobilePreview(item)
                }
            }}
        >
            <Box position="relative" w="full" h="full">
                <Box
                    position="absolute"
                    left="50%"
                    transform="translateX(-50%)"
                    top="0"
                    w={`${STROKE_OUTER}px`}
                    h="full"
                    borderTopRadius={item.clippedTop || !item.showEndEndpoint ? "0" : "full"}
                    borderBottomRadius={item.clippedBottom || !item.showStartEndpoint ? "0" : "full"}
                    bg={`${item.data.color}.600`}
                />
                {item.showStartEndpoint && <Endpoint color={item.data.color} centerY={item.startY - item.lineTop} />}
                {item.showEndEndpoint && <Endpoint color={item.data.color} centerY={item.endY - item.lineTop} ongoing={item.data.ongoing} />}
            </Box>
        </Box>
    }
    return <HoverCard.Root
        openDelay={120}
        closeDelay={240}
        positioning={{ placement: "right-start", offset: { mainAxis: 10, crossAxis: 0 } }}
    >
        <HoverCard.Trigger asChild>
            <Box
                asChild
                position="absolute"
                left={`${props.left}px`}
                top={`${item.lineTop}px`}
                w={`${props.width}px`}
                h={`${item.lineHeight}px`}
                overflow="visible"
                cursor="pointer"
                _hover={{ transform: "translateX(2px)" }}
                transition="left 0.24s cubic-bezier(0.22, 1, 0.36, 1), transform 0.15s ease"
            >
                <NextLink href={item.data.href}>
                    <Box position="relative" w="full" h="full">
                        <Box
                            position="absolute"
                            left="50%"
                            transform="translateX(-50%)"
                            top="0"
                            w={`${STROKE_OUTER}px`}
                            h="full"
                            borderTopRadius={item.clippedTop || !item.showEndEndpoint ? "0" : "full"}
                            borderBottomRadius={item.clippedBottom || !item.showStartEndpoint ? "0" : "full"}
                            bg={`${item.data.color}.600`}
                        />

                        {item.showStartEndpoint && <Endpoint color={item.data.color} centerY={item.startY - item.lineTop} />}
                        {item.showEndEndpoint && <Endpoint color={item.data.color} centerY={item.endY - item.lineTop} ongoing={item.data.ongoing} />}
                    </Box>
                </NextLink>
            </Box>
        </HoverCard.Trigger>
        <Portal>
            <HoverCard.Positioner>
                <HoverCard.Content>
                    <Flex maxW="min(360px, calc(100vw - 140px))" gap="2" align="flex-start">
                        <Box
                            w="46px"
                            h="46px"
                            rounded="md"
                            bg="bg.muted"
                            overflow="hidden"
                            flexShrink={0}
                            borderWidth="1px"
                        >
                            <Image src={item.data.avatar ?? emptyCover.src} alt={item.data.title} w="full" h="full" objectFit="cover" />
                        </Box>
                        <Box minW={0}>
                            <Text fontWeight="600" lineClamp={2}>{item.data.title}</Text>
                            <Flex direction="column" align="flex-start" gap="1" mb="1" minW={0}>
                                <Text fontSize="xs" color="fg.muted" lineHeight="1.3">
                                    {info}
                                </Text>
                                <Flex align="center" gap="2" flexWrap="wrap">
                                    <Badge colorPalette={item.data.color} variant="subtle">
                                        {item.data.ongoing ? "进行中" : "已结束"}
                                    </Badge>
                                    {item.data.summary && (
                                        <Badge alignSelf="flex-start" variant="outline" colorPalette={item.data.color}>
                                            {item.data.summary}
                                        </Badge>
                                    )}
                                </Flex>
                            </Flex>
                        </Box>
                    </Flex>
                </HoverCard.Content>
            </HoverCard.Positioner>
        </Portal>
    </HoverCard.Root>
})

function useTimelineBounds(items: TimelineItem[]): { globalMinAt: Date, globalMaxAt: Date } {
    return useMemo(() => {
        const now = new Date()
        if(items.length === 0) {
            return { globalMinAt: now, globalMaxAt: now }
        }
        let minAt = items[0].startAt
        let maxAt = items[0].endAt ?? now
        for(const item of items) {
            const start = item.startAt
            const end = item.endAt ?? now
            if(start < minAt) minAt = start
            if(end > maxAt) maxAt = end
        }
        return { globalMinAt: minAt, globalMaxAt: maxAt }
    }, [items])
}

function useTimelineTicks(minAt: Date, maxAt: Date, visibleDaysOnScreen: number): TimelineTick[] {
    return useMemo(() => {
        if(visibleDaysOnScreen <= 15) {
            const first = startOfDay(minAt)
            const ticks: TimelineTick[] = []
            for(let d = new Date(first); d <= maxAt; d = addDays(d, 1)) {
                ticks.push({
                    at: new Date(d),
                    label: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                })
            }
            return ticks
        }
        if(visibleDaysOnScreen <= 30) return generateMonthlySteppedTicks(minAt, maxAt, 3)
        if(visibleDaysOnScreen <= 90) return generateMonthlySteppedTicks(minAt, maxAt, 5)
        if(visibleDaysOnScreen <= 180) return generateMonthlyAnchoredTicks(minAt, maxAt, [1, 16])

        const ticks: TimelineTick[] = []
        const first = new Date(minAt.getFullYear(), minAt.getMonth(), 1)
        for(let d = first; d <= maxAt; d = addMonths(d, 1)) {
            ticks.push({
                at: new Date(d),
                label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            })
        }
        return ticks
    }, [minAt, maxAt, visibleDaysOnScreen])
}

function useVisibleTimeRange(
    scrollTop: number,
    viewportHeight: number,
    globalMaxAt: Date,
    yToDate: (y: number, globalMaxAt: Date) => Date
): VisibleTimeRange {
    return useMemo(() => {
        const viewTop = scrollTop
        const viewBottom = scrollTop + viewportHeight
        const renderTop = Math.max(0, viewTop - RENDER_OVERSCAN_PX)
        const renderBottom = viewBottom + RENDER_OVERSCAN_PX
        const newerAt = yToDate(viewTop, globalMaxAt)
        const olderAt = yToDate(viewBottom, globalMaxAt)
        return { newerAt, olderAt, viewTop, viewBottom, renderTop, renderBottom }
    }, [scrollTop, viewportHeight, globalMaxAt, yToDate])
}

function useVisibleTimelineItems(
    items: TimelineItem[],
    globalMaxAt: Date,
    visibleTimeRange: VisibleTimeRange,
    groupByFollowType: boolean,
    dateToY: (date: Date, globalMaxAt: Date) => number
): VisibleTimelineItem[] {
    return useMemo(() => {
        const now = new Date()
        const bufferedNewerAt = addDays(visibleTimeRange.newerAt, VIEWPORT_BUFFER_DAYS)
        const bufferedOlderAt = addDays(visibleTimeRange.olderAt, -VIEWPORT_BUFFER_DAYS)
        const layoutNewerAt = addDays(visibleTimeRange.newerAt, LAYOUT_BUFFER_DAYS)
        const layoutOlderAt = addDays(visibleTimeRange.olderAt, -LAYOUT_BUFFER_DAYS)
        const slicedItems = items
            .map((item) => {
                const endAt = item.endAt ?? now
                if(endAt < layoutOlderAt || item.startAt > layoutNewerAt) return null
                return { data: item, startAt: item.startAt, endAt }
            })
            .filter((item): item is Omit<PositionedItem, "lane"> => item !== null)
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

        const positioned = assignLanes(slicedItems, groupByFollowType)

        return positioned
            .map((item) => {
                if(item.endAt < bufferedOlderAt || item.startAt > bufferedNewerAt) return null
                const startY = dateToY(item.startAt, globalMaxAt)
                const endY = dateToY(item.endAt, globalMaxAt)
                const minY = Math.min(startY, endY)
                const maxY = Math.max(startY, endY)
                const clippedTop = minY < visibleTimeRange.renderTop
                const clippedBottom = maxY > visibleTimeRange.renderBottom
                const lineTop = Math.max(visibleTimeRange.renderTop, minY)
                const lineBottom = Math.min(visibleTimeRange.renderBottom, maxY)
                return {
                    ...item,
                    startY,
                    endY,
                    lineTop,
                    lineHeight: Math.max(0, lineBottom - lineTop),
                    showStartEndpoint: startY >= visibleTimeRange.renderTop && startY <= visibleTimeRange.renderBottom,
                    showEndEndpoint: endY >= visibleTimeRange.renderTop && endY <= visibleTimeRange.renderBottom,
                    clippedTop,
                    clippedBottom,
                }
            })
            .filter((item): item is VisibleTimelineItem => item !== null)
    }, [items, globalMaxAt, visibleTimeRange, groupByFollowType, dateToY])
}

function addDays(date: Date, diff: number): Date {
    return new Date(date.getTime() + diff * DAY_MS)
}

function addMonths(date: Date, diff: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + diff, 1)
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function generateMonthlySteppedTicks(minAt: Date, maxAt: Date, stepDays: number): TimelineTick[] {
    const ticks: TimelineTick[] = []
    const firstMonth = new Date(minAt.getFullYear(), minAt.getMonth(), 1)
    for(let month = new Date(firstMonth); month <= maxAt; month = addMonths(month, 1)) {
        const y = month.getFullYear()
        const m = month.getMonth()
        const monthTicks: Date[] = []
        for(let day = 1; day <= 31; day += stepDays) {
            const d = new Date(y, m, day)
            if(d.getMonth() !== m) break
            monthTicks.push(d)
        }
        const nextMonthFirst = new Date(y, m + 1, 1)
        const lastTick = monthTicks[monthTicks.length - 1]
        if(lastTick && diffDays(nextMonthFirst, lastTick) <= 3) {
            monthTicks.pop()
        }
        for(const d of monthTicks) {
            if(d < minAt || d > maxAt) continue
            ticks.push({
                at: d,
                label: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
            })
        }
    }
    return ticks
}

function generateMonthlyAnchoredTicks(minAt: Date, maxAt: Date, anchors: number[]): TimelineTick[] {
    const ticks: TimelineTick[] = []
    const firstMonth = new Date(minAt.getFullYear(), minAt.getMonth(), 1)
    for(let month = new Date(firstMonth); month <= maxAt; month = addMonths(month, 1)) {
        for(const day of anchors) {
            const d = new Date(month.getFullYear(), month.getMonth(), day)
            if(d.getMonth() !== month.getMonth()) continue
            if(d < minAt || d > maxAt) continue
            ticks.push({
                at: d,
                label: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
            })
        }
    }
    return ticks
}

function diffDays(a: Date, b: Date): number {
    return (a.getTime() - b.getTime()) / DAY_MS
}

function Endpoint({ color, centerY, ongoing }: { color: string, centerY: number, ongoing?: boolean }) {
    return <Box
        position="absolute"
        left="50%"
        top={`${centerY}px`}
        transform="translate(-50%, -50%)"
        w={`${ENDPOINT_OUTER}px`}
        h={`${ENDPOINT_OUTER}px`}
        rounded="full"
        bg={`${color}.600`}
    >
        {!ongoing && <Box
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            w={`${ENDPOINT_INNER}px`}
            h={`${ENDPOINT_INNER}px`}
            rounded="full"
            bg={`${color}.300`}
        />}
    </Box>
}

function assignLanes(
    items: Omit<PositionedItem, "lane">[],
    groupByFollowType: boolean
): PositionedItem[] {
    if(!groupByFollowType) {
        const laneEndTimes: number[] = []
        return items.map((item) => {
            let lane = laneEndTimes.findIndex((t) => t <= item.startAt.getTime())
            if(lane === -1) {
                lane = laneEndTimes.length
                laneEndTimes.push(item.endAt.getTime())
            }else{
                laneEndTimes[lane] = item.endAt.getTime()
            }
            return { ...item, lane }
        })
    }

    const grouped = new Map<number, Omit<PositionedItem, "lane">[]>()
    for(const item of items) {
        const groupKey = followTypeOrder(item.data.followType)
        const arr = grouped.get(groupKey)
        if(arr) arr.push(item)
        else grouped.set(groupKey, [item])
    }

    let laneOffset = 0
    const result: PositionedItem[] = []
    const order = [0, 1, 2, 3]
    for(const type of order) {
        const rows = grouped.get(type)
        if(!rows || rows.length === 0) continue
        const laneEndTimes: number[] = []
        for(const item of rows) {
            let lane = laneEndTimes.findIndex((t) => t <= item.startAt.getTime())
            if(lane === -1) {
                lane = laneEndTimes.length
                laneEndTimes.push(item.endAt.getTime())
            }else{
                laneEndTimes[lane] = item.endAt.getTime()
            }
            result.push({ ...item, lane: lane + laneOffset })
        }
        laneOffset += laneEndTimes.length
    }
    return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime() || a.lane - b.lane)
}

function followTypeOrder(type: FollowType | null): number {
    return type ? FOLLOW_TYPE_LANE_ORDER[type] : 3
}

function useIsCoarsePointer(): boolean {
    const [coarse, setCoarse] = useState(false)
    useEffect(() => {
        if(typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const media = window.matchMedia("(pointer: coarse)")
        const update = () => setCoarse(media.matches)
        update()
        media.addEventListener("change", update)
        return () => media.removeEventListener("change", update)
    }, [])
    return coarse
}
