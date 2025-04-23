"use client"
import React, { memo } from "react"
import NextLink from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import {
    RiBarChartBoxAiLine, RiBookmark3Line, RiBookOpenFill, RiDatabase2Fill, RiFilmFill, RiGamepadFill,
    RiImageFill, RiPenNibLine, RiPulseFill, RiTvLine
} from "react-icons/ri"
import { Avatar, Box, Button, Collapsible, Heading, Stack, SystemStyleObject, Text } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"

const headerFont = Lora({
    weight: "700",
    subsets: ["latin"],
    display: "swap",
});

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
            <Heading className={headerFont.className} flex="0 0 auto" mx="4" lg={{mx: "0", mt: "4"}}><NextLink href="/">REEL HUB</NextLink></Heading>

            <HorizontalMenuList selected={selected} selectedSub={selectedSub}/>

            {avatar ? <>
                <Avatar.Root flex="0 0 auto" lg={{mt: "4"}} size={{base: "sm", xl: "xl"}}>
                    <Avatar.Fallback name={avatar.name}/>
                    <Avatar.Image src={avatar.image ?? undefined}/>
                </Avatar.Root>
                <Text flex="0 0 auto" mx="2" lgOnly={{display: "none"}} lg={{mx: "0", mt: "1"}}>{avatar.name}</Text>
            </> : <>
                <LoginButton flex="0 0 auto" lg={{mt: "4"}}/>
            </>}

            <VerticalMenuList selected={selected} selectedSub={selectedSub}/>
        </Box>
    )
}

const HorizontalMenuList = memo(function HorizontalMenuList({ selected, selectedSub }: {selected?: (typeof NAVIGATIONS)[number], selectedSub?: (typeof NAVIGATIONS)[number]["children"][number]}) {
    const textDisplay: SystemStyleObject["display"] = {base: "none", sm: "initial"}
    return (<Box display={{base: "flex", lg: "none"}} flex="1 1 100%">
        {selected !== undefined ? selected.children.map(item => (
            <Button key={item.href} variant={selectedSub === item ? "subtle" : "solid"} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text display={textDisplay}>{item.label}</Text></NextLink></Button>
        )) : NAVIGATIONS.map(item => (
            <Button key={item.href} variant="solid" asChild><NextLink href={item.href}>{item.icon}<Text display={textDisplay}>{item.label}</Text></NextLink></Button>
        ))}
    </Box>)
})

const VerticalMenuList = memo(function VerticalMenuList({ selected, selectedSub }: {selected?: (typeof NAVIGATIONS)[number], selectedSub?: (typeof NAVIGATIONS)[number]["children"][number]}) {
    return (
        <Stack display={{base: "none", lg: "flex"}} py="1" px="2" mt="4" width="100%" overflowY="auto" overflowX="hidden">
            {NAVIGATIONS.map(item => <VerticalMenuButtonGroup key={item.href} {...item} selected={selected === item ? (selectedSub || true) : false}/>)}
        </Stack>
    )
})

const VerticalMenuButtonGroup = memo(function VerticalMenuButtonGroup(props: (typeof NAVIGATIONS)[number] & {selected: boolean | (typeof NAVIGATIONS)[number]["children"][number]}) {
    const textDisplay: SystemStyleObject["display"] = {base: "none", xl: "initial"}
    return (<>
        <Button variant="solid" opacity={props.selected ? undefined : "80%"} asChild><NextLink href={props.href}>{props.icon}<Text display={textDisplay}>{props.label}</Text></NextLink></Button>
        <Collapsible.Root open={!!props.selected}>
            <Collapsible.Content>
                <Stack gap="1" my="2" py="2" mx="1" borderTopWidth="1px" borderBottomWidth="1px" borderColor="colorPalette.contrast">
                    {props.children.map(item => (
                        <Button key={item.href} variant={props.selected === item ? "subtle" : "solid"} size="sm" asChild><NextLink href={item.href}>{item.icon}<Text display={textDisplay}>{item.label}</Text></NextLink></Button>
                    ))}
                </Stack>
            </Collapsible.Content>
        </Collapsible.Root>
    </>)
})

const LoginButton = memo(function LoginButton(props: SystemStyleObject) {
    const { data: session } = useSession()
    const login = async () => {
        if(session?.user) {
            await signOut()
        }else{
            await signIn("auth-service")
        }
    }

    return <Button {...props} type="submit" variant="outline" onClick={login}>
        {session?.user ? "登出" : "登录"}
    </Button>
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