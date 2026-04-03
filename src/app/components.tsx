"use client"
import React, { memo, useEffect, useMemo } from "react"
import NextLink from "next/link"
import localFont from "next/font/local"
import { usePathname, useRouter } from "next/navigation"
import { SessionProvider, signIn, signOut } from "next-auth/react"
import { RiArrowDownSFill, RiArrowLeftSLine, RiArrowRightSLine, RiHome3Line, RiLoginBoxLine, RiLogoutBoxLine, RiSettings2Fill } from "react-icons/ri"
import { Avatar, Badge, Box, Button, Collapsible, Flex, Heading, IconButton, Menu, Portal, Stack, SystemStyleObject, Text, useBreakpointValue } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"
import { Toaster } from "@/components/ui/toaster"
import { DISPLAY_TIMEZONE_COOKIE, DISPLAY_TIMEZONE_COOKIE_MAX_AGE_SEC, TIMEZME_CHECK_KEY, TIMEZME_CHECK_INTERVAL_MS } from "@/constants/system"
import { NavigationItem, NAVIGATIONS, NavigationSubItem } from "@/constants/ui"
import type { EpisodeTimeTableGroup, EpisodeTimeTableItem } from "@/schemas/project"
import { updateUserPreference } from "@/services/user-preference"
import { resAvatar } from "@/helpers/ui"
import { dates } from "@/helpers/primitive"
import { useEffectState } from "@/helpers/hooks"

const headerFont = localFont({
    src: [
        {
            path: "../assets/fonts/lora-latin-700.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    display: "swap",
})

export function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>
        <Provider>
            {children}
            <Toaster/>
        </Provider>
    </SessionProvider>
}

/** 主页侧栏未登录时的登录按钮（需客户端触发 signIn） */
export function HomeGuestLoginButton() {
    return (
        <Button width="100%" variant="solid" colorPalette="teal" onClick={() => signIn("auth-service")}>
            <RiLoginBoxLine/> 登录
        </Button>
    )
}

export function NavigationSideBar(props: {avatar?: {name: string, image?: string}, isLogin: boolean} & SystemStyleObject) {
    const { avatar, isLogin, ...attrs } = props

    const pathname = usePathname()

    const selected = NAVIGATIONS.find(n => pathname.startsWith(n.href))
    const selectedSub = selected?.children.find(n => pathname.startsWith(n.href))

    const themeColor = selected?.theme ?? "teal"

    const sideBase: SystemStyleObject = {height: "50px", width: "100vw", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background-color 0.2s", ...attrs}
    const sideLg: SystemStyleObject = {height: "100vh", width: "60px", flexDirection: "column", justifyContent: "initial"}
    const sideXl: SystemStyleObject = {height: "100vh", width: "200px"}

    return (
        <Box {...sideBase} lg={sideLg} xl={sideXl} position="fixed" left="0" top="0" textAlign="center" colorPalette={themeColor} bg="colorPalette.solid" color="colorPalette.contrast">
            <Heading className={headerFont.className} flex="0 0 auto" display="none" sm={{display: "block"}} mx="4" lg={{mx: "0", mt: "4"}}><NextLink href="/">REEL HUB</NextLink></Heading>

            <Box flex="1 1 50%" display={{base: "none", sm: "block", lg: "none"}}/>
            <HorizontalMenuDropdown selected={selected}/>
            <Box flex="1 1 20%" display={{base: "block", sm: "none"}}/>
            <HorizontalMenuList selected={selected} selectedSub={selectedSub} isLogin={isLogin}/>
            <Box flex="1 1 50%" display={{lg: "none"}}/>

            <User avatar={avatar}/>

            <VerticalMenuList selected={selected} selectedSub={selectedSub} isLogin={isLogin}/>
        </Box>
    )
}

const User = memo(function User({ avatar }: {avatar?: {name: string, image?: string}}) {
    const router = useRouter()

    const preference = () => router.push("/user/preference")
    const login = () => signIn("auth-service")
    const logout = () => signOut()

    return avatar ? <Menu.Root>
        <Menu.Trigger asChild>
            <Box flex="0 0 auto" display="flex" alignItems="center" flexDirection={{base: "row", lg: "column"}}>
                <Avatar.Root mx="1" lg={{mt: "4"}} size={{base: "sm", xl: "xl"}}>
                    <Avatar.Fallback name={avatar.name}/>
                    <Avatar.Image src={avatar.image ?? undefined}/>
                </Avatar.Root>
                <Box ml="1" mr="2" display={{base: "none", sm: "block", lgOnly: "none"}} lg={{ml: "0", mr: "0", mt: "1"}}>{avatar.name}</Box>
            </Box>
        </Menu.Trigger>
        <Portal>
            <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item key="preference" onClick={preference} value="偏好设置"><RiSettings2Fill/> 偏好设置</Menu.Item>
                    <Menu.Item key="logout" onClick={logout} value="登出"><RiLogoutBoxLine/> 登出</Menu.Item>
                </Menu.Content>
            </Menu.Positioner>
        </Portal>
    </Menu.Root> : (
        <Button variant="outline" size="sm" color="colorPalette.contrast" flex="0 0 auto" mr="2" lg={{mt: "4", mr: "0"}} onClick={login}>
            <RiLoginBoxLine/><Text display={{lgOnly: "none"}}>登录</Text>
        </Button>
    )
})

const HorizontalMenuList = memo(function HorizontalMenuList({ selected, selectedSub, isLogin }: {selected?: NavigationItem, selectedSub?: NavigationSubItem, isLogin: boolean}) {
    const textStyle: SystemStyleObject = {display: {base: "none", md: "initial"}}
    const buttonStyle: SystemStyleObject = {width: {base: "9", md: "auto"}, px: {md: "2"}}
    return (
        <Box display={{base: "flex", lg: "none"}} flex="0 0 auto" justifyContent="center">
            {selected !== undefined ? selected.children.filter(item => !item.loginOnly || isLogin).map(item => (
                <Button key={item.href} variant={selectedSub === item ? "subtle" : "solid"} {...buttonStyle} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
            )) : NAVIGATIONS.map(item => (
                <Button key={item.href} variant="solid" {...buttonStyle} asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
            ))}
        </Box>
    )
})

const VerticalMenuList = memo(function VerticalMenuList({ selected, selectedSub, isLogin }: {selected?: NavigationItem, selectedSub?: NavigationSubItem, isLogin: boolean}) {
    return (
        <Stack display={{base: "none", lg: "flex"}} py="1" px="2" mt="4" width="100%" overflowY="auto" overflowX="hidden">
            {NAVIGATIONS.map(item => <VerticalMenuButtonGroup key={item.href} {...item} selected={selected === item ? (selectedSub || true) : false} isLogin={isLogin}/>)}
        </Stack>
    )
})

const HorizontalMenuDropdown = memo(function HorizontalMenuDropdown({ selected, ...attrs }: {selected?: NavigationItem} & SystemStyleObject) {
    return (
        selected ? <Menu.Root>
            <Menu.Trigger asChild>
                <Button display={{lg: "none"}} variant={{base: "solid", sm: "outline"}} color="colorPalette.contrast" size="sm" pl="2" pr="1" mx="1" {...attrs}>{selected.icon} {selected.label} <RiArrowDownSFill/></Button>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item display={{base: "flex", sm: "none"}} key="/" value="主页" asChild>
                            <NextLink href="/"><RiHome3Line/> 主页</NextLink>
                        </Menu.Item>
                        {NAVIGATIONS.map(item => <Menu.Item key={item.href} value={item.label} asChild>
                            <NextLink href={item.href}>{item.icon} {item.label}</NextLink>
                        </Menu.Item>)}
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
        : <Button display={{sm: "none"}} variant="solid" pl="2" pr="1" mr="1" {...attrs}><NextLink href="/"><RiHome3Line/></NextLink></Button>
    )
})

const VerticalMenuButtonGroup = memo(function VerticalMenuButtonGroup(props: NavigationItem & {selected: boolean | NavigationSubItem, isLogin: boolean}) {
    const textStyle: SystemStyleObject = {display: {base: "none", xl: "initial"}}
    return (<>
        <Button variant="solid" opacity={props.selected ? undefined : "80%"} asChild><NextLink href={props.href}>{props.icon}<Text {...textStyle}>{props.label}</Text></NextLink></Button>
        <Collapsible.Root open={!!props.selected}>
            <Collapsible.Content>
                <Stack gap="1" my="2" py="2" mx="1" borderTopWidth="1px" borderBottomWidth="1px" borderColor="colorPalette.contrast">
                    {props.children.filter(item => !item.loginOnly || props.isLogin).map(item => (
                        <Button key={item.href} variant={props.selected === item ? "subtle" : "solid"} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
                    ))}
                </Stack>
            </Collapsible.Content>
        </Collapsible.Root>
    </>)
})

export function TimezoneAutoWriter({ autoTimezoneEnabled, preferenceTimezone }: { autoTimezoneEnabled: boolean, preferenceTimezone: string | null }) {
    useEffect(() => {
        if(typeof window === "undefined") return

        const now = Date.now()
        const raw = window.localStorage.getItem(TIMEZME_CHECK_KEY)
        const lastCheckAt = raw ? Number.parseInt(raw, 10) : NaN
        if(!Number.isNaN(lastCheckAt) && (now - lastCheckAt) < TIMEZME_CHECK_INTERVAL_MS) return
        window.localStorage.setItem(TIMEZME_CHECK_KEY, `${now}`)

        let browserTimezone: string | undefined
        try {
            browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
            return
        }
        if(!browserTimezone) return

        const cookieTz = readDisplayTimezoneCookie()
        if(browserTimezone !== cookieTz) writeDisplayTimezoneCookie(browserTimezone)

        if(autoTimezoneEnabled && browserTimezone !== preferenceTimezone) {
            void updateUserPreference({ timezone: browserTimezone })
        }
    }, [autoTimezoneEnabled, preferenceTimezone])

    return null
}

function readDisplayTimezoneCookie(): string | null {
    if(typeof document === "undefined") return null
    const m = document.cookie.match(new RegExp(`(?:^|; )${DISPLAY_TIMEZONE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`))
    const v = m ? decodeURIComponent(m[1]) : null
    return v && dates.isValidIanaTimeZone(v) ? v : null
}

function writeDisplayTimezoneCookie(value: string): void {
    if(typeof document === "undefined") return
    if(!dates.isValidIanaTimeZone(value)) return
    const enc = encodeURIComponent(value)
    document.cookie = `${DISPLAY_TIMEZONE_COOKIE}=${enc}; Path=/; Max-Age=${DISPLAY_TIMEZONE_COOKIE_MAX_AGE_SEC}; SameSite=Lax`
}

export function EpisodeTimeTable(props: { groups: EpisodeTimeTableGroup[], displayTimeZone: string }) {
    const { groups, displayTimeZone } = props

    const todayWeekday = useMemo(() => isoWeekdayInTimeZone(new Date(), displayTimeZone), [displayTimeZone])
    
    const viewSize = useBreakpointValue({base: 3, md: 5}) ?? 3
    
    const [shift, setShift] = useEffectState(todayWeekday - Math.floor(viewSize / 2) - 1)

    const seasonYearHeader = useMemo(() => episodeTimetableSeasonYearTitle(new Date(), displayTimeZone), [displayTimeZone])

    const columns = useMemo(() => episodeTimetableVisibleWeekdays(shift, viewSize).map(w => groups.find(g => g.weekday === w) ?? {weekday: w, items: []}), [shift, viewSize])

    return (
        <Box borderWidth="1px" rounded="md" overflow="hidden">
            <Flex align="center" justify="space-between" gap="2" px="2" py="2" borderBottomWidth="1px" bg="bg.subtle">
                <IconButton aria-label="向前" variant="ghost" size="sm" onClick={() => setShift(s => (s - 1) % 7)}>
                    <RiArrowLeftSLine/>
                </IconButton>
                <Text fontSize="sm" color="fg.muted" fontWeight="bold" flex="1" textAlign="center">
                    {seasonYearHeader}
                </Text>
                <IconButton aria-label="向后" variant="ghost" size="sm" onClick={() => setShift(s => (s + 1) % 7)}>
                    <RiArrowRightSLine/>
                </IconButton>
            </Flex>
            <Flex align="stretch" minH="120px">
                {columns.map((col, colIdx) => <TimeTableColumn key={col.weekday} col={col} today={col.weekday === todayWeekday} colIdx={colIdx}/>)}
            </Flex>
        </Box>
    )
}

const TimeTableColumn = memo(function TimeTableColumn({ col, today, colIdx }: { col: { weekday: number, items: EpisodeTimeTableItem[] }, today: boolean, colIdx: number }) {
    return (
        <Box flex="1 1 0" minW="0" py="2" borderLeftWidth={colIdx === 0 ? "0" : "1px"} borderColor="border">
            <Flex align="center" justify="center" gap="1" mb="2" flexWrap="wrap">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {EPISODE_TIMETABLE_WEEKDAY_LABELS[col.weekday - 1]}
                </Text>
                {today && <Badge size="sm" variant="subtle" colorPalette="teal">今天</Badge>}
            </Flex>
            <Stack maxH="min(70vh, 520px)" overflowY="auto">
                {col.items.map(item => <TimeTableRow key={item.project.id} item={item}/>)}
            </Stack>
        </Box>
    )
})

const TimeTableRow = memo(function TimeTableRow({ item }: { item: EpisodeTimeTableItem }) {
    return (
        <Flex gap="2" align="flex-start" p="2" transition="background 0.15s" _hover={{ bg: "bg.subtle" }} asChild>
            <NextLink href={`/${item.project.type.toLowerCase()}/database/${item.project.id}`}>
                <Avatar.Root size="sm" shape="rounded" flexShrink={0}>
                    <Avatar.Fallback name={item.project.title}/>
                    <Avatar.Image src={resAvatar(item.project.resources)}/>
                </Avatar.Root>
                <Box minW={0} flex="1">
                    <Text fontSize="xs" fontWeight="medium" lineClamp={2} title={item.project.title}>
                        {item.project.title}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                        {dates.format(item.nextPublishTime, "timeOnly")} · 第{item.nextPublishPlanItem.actualEpisodeNum ?? item.nextPublishPlanItem.index}话
                    </Text>
                </Box>
            </NextLink>
        </Flex>
    )
})


const EPISODE_TIMETABLE_WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const

const ISO_WEEKDAY_NAME_TO_NUM: Record<string, number> = {
    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
}

function isoWeekdayInTimeZone(date: Date, timeZone: string): number {
    const name = Intl.DateTimeFormat("en-US", { timeZone: timeZone, weekday: "long" }).format(date)
    return ISO_WEEKDAY_NAME_TO_NUM[name] ?? 1
}

function episodeTimetableVisibleWeekdays(shift: number, viewSize: number): number[] {
    return Array.from({ length: viewSize }, (_, j) => ((shift + j + 21) % 7) + 1)
}

function episodeTimetableSeasonYearTitle(date: Date, timeZone: string): string {
    const parts = Intl.DateTimeFormat("en-CA", { timeZone: timeZone, year: "numeric", month: "2-digit" }).formatToParts(date)
    const year = parseInt(parts.find(p => p.type === "year")!.value, 10)
    const month = parseInt(parts.find(p => p.type === "month")!.value, 10)
    const season = month <= 3 ? "冬" : month <= 6 ? "春" : month <= 9 ? "夏" : "秋"
    return `${year}年 · ${season}季`
}
