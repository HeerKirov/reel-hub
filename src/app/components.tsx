"use client"
import React, { memo } from "react"
import NextLink from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import { SessionProvider, signIn, signOut } from "next-auth/react"
import {
    RiArrowDownSFill,
    RiBarChartBoxAiLine, RiBookmark3Line, RiBookOpenFill, RiDatabase2Fill, RiFilmFill, RiGamepadFill, RiHome3Line,
    RiImageFill, RiLoginBoxLine, RiLogoutBoxLine, RiPenNibLine, RiPulseFill, RiTvLine
} from "react-icons/ri"
import { Avatar, Box, Button, Collapsible, Heading, Menu, Portal, Stack, SystemStyleObject, Text } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"

const headerFont = Lora({
    weight: "700",
    subsets: ["latin"],
    display: "swap",
})

export function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>
        <Provider>
            {children}
        </Provider>
    </SessionProvider>
}

export function NavigationSideBar(props: {avatar?: {name: string, image?: string}} & SystemStyleObject) {
    const { avatar, ...attrs } = props

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
            <Box flex="1 1 50%" display={{base: "block", sm: "none"}}/>
            <HorizontalMenuList selected={selected} selectedSub={selectedSub}/>
            <Box flex="1 1 50%" display={{lg: "none"}}/>

            <User avatar={avatar}/>

            <VerticalMenuList selected={selected} selectedSub={selectedSub}/>
        </Box>
    )
}

const User = memo(function User({ avatar }: {avatar?: {name: string, image?: string}}) {

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

const HorizontalMenuList = memo(function HorizontalMenuList({ selected, selectedSub }: {selected?: (typeof NAVIGATIONS)[number], selectedSub?: (typeof NAVIGATIONS)[number]["children"][number]}) {
    const textStyle: SystemStyleObject = {display: {base: "none", md: "initial"}}
    const buttonStyle: SystemStyleObject = {width: {base: "9", md: "auto"}}
    return (
        <Box display={{base: "flex", lg: "none"}} flex="0 0 auto" justifyContent="center">
            {selected !== undefined ? selected.children.map(item => (
                <Button key={item.href} variant={selectedSub === item ? "subtle" : "solid"} {...buttonStyle} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
            )) : NAVIGATIONS.map(item => (
                <Button key={item.href} variant="solid" {...buttonStyle} asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
            ))}
        </Box>
    )
})

const VerticalMenuList = memo(function VerticalMenuList({ selected, selectedSub }: {selected?: (typeof NAVIGATIONS)[number], selectedSub?: (typeof NAVIGATIONS)[number]["children"][number]}) {
    return (
        <Stack display={{base: "none", lg: "flex"}} py="1" px="2" mt="4" width="100%" overflowY="auto" overflowX="hidden">
            {NAVIGATIONS.map(item => <VerticalMenuButtonGroup key={item.href} {...item} selected={selected === item ? (selectedSub || true) : false}/>)}
        </Stack>
    )
})

const HorizontalMenuDropdown = memo(function HorizontalMenuDropdown({ selected, ...attrs }: {selected?: (typeof NAVIGATIONS)[number]} & SystemStyleObject) {
    return (
        selected ? <Menu.Root>
            <Menu.Trigger asChild>
                <Button {...attrs} display={{lg: "none"}} variant={{base: "solid", sm: "outline"}} color="colorPalette.contrast" size="sm" pl="2" pr="1" mx="1">{selected.icon} {selected.label} <RiArrowDownSFill/></Button>
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
        : <Button {...attrs} display={{sm: "none"}} variant="solid" pl="2" pr="1" mr="1"><NextLink href="/"><RiHome3Line/></NextLink></Button>
    )
})

const VerticalMenuButtonGroup = memo(function VerticalMenuButtonGroup(props: (typeof NAVIGATIONS)[number] & {selected: boolean | (typeof NAVIGATIONS)[number]["children"][number]}) {
    const textStyle: SystemStyleObject = {display: {base: "none", xl: "initial"}}
    return (<>
        <Button variant="solid" opacity={props.selected ? undefined : "80%"} asChild><NextLink href={props.href}>{props.icon}<Text {...textStyle}>{props.label}</Text></NextLink></Button>
        <Collapsible.Root open={!!props.selected}>
            <Collapsible.Content>
                <Stack gap="1" my="2" py="2" mx="1" borderTopWidth="1px" borderBottomWidth="1px" borderColor="colorPalette.contrast">
                    {props.children.map(item => (
                        <Button key={item.href} variant={props.selected === item ? "subtle" : "solid"} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text {...textStyle}>{item.label}</Text></NextLink></Button>
                    ))}
                </Stack>
            </Collapsible.Content>
        </Collapsible.Root>
    </>)
})

const NAVIGATIONS: {label: string, href: string, icon: React.ReactNode, theme: string, children: {label: string, href: string, icon: React.ReactNode}[]}[] = [
    {
        label: "动画", href: "/anime", icon: <RiTvLine/>, theme: "blue",
        children: [
            {label: "数据库", href: "/anime/database", icon: <RiDatabase2Fill/>},
            {label: "订阅", href: "/anime/subscription", icon: <RiBookmark3Line/>},
            {label: "时间线", href: "/anime/timeline", icon: <RiPulseFill/>},
            {label: "评价", href: "/anime/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/anime/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "游戏", href: "/game", icon: <RiGamepadFill/>, theme: "green",
        children: [
            {label: "数据库", href: "/game/database", icon: <RiDatabase2Fill/>},
            {label: "游玩记录", href: "/game/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/game/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/game/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "电影", href: "/movie", icon: <RiFilmFill/>, theme: "orange",
        children: [
            {label: "数据库", href: "/movie/database", icon: <RiDatabase2Fill/>},
            {label: "观看记录", href: "/movie/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/movie/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/movie/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "小说", href: "/novel", icon: <RiBookOpenFill/>, theme: "cyan",
        children: [
            {label: "数据库", href: "/novel/database", icon: <RiDatabase2Fill/>},
            {label: "足迹", href: "/novel/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/novel/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/novel/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "漫画", href: "/manga", icon: <RiImageFill/>, theme: "pink",
        children: [
            {label: "数据库", href: "/manga/database", icon: <RiDatabase2Fill/>},
            {label: "足迹", href: "/manga/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/manga/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/manga/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
]