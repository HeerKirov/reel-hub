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
import { Avatar, Box, Button, For, Heading, Stack, SystemStyleObject, Text } from "@chakra-ui/react"
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

    const sideBase: SystemStyleObject = {height: "40px", width: "100vw", transition: "background-color 0.2s", ...attrs}
    const sideLg: SystemStyleObject = {height: "100vh", width: "200px"}

    return (
        <Box {...sideBase} lg={sideLg} position="fixed" left="0" top="0" textAlign="center" colorPalette={themeColor} bg="colorPalette.solid" color="colorPalette.contrast">
            <Heading className={headerFont.className} mt="4"><NextLink href="/">REEL HUB</NextLink></Heading>

            {avatar ? <>
                <Avatar.Root mt="4" size="xl">
                    <Avatar.Fallback name={avatar.name}/>
                    <Avatar.Image src={avatar.image ?? undefined}/>
                </Avatar.Root>
                <Text mt="1">{avatar.name}</Text>
            </> : <>
                <LoginButton mt="4"/>
            </>}

            <Stack py="1" px="2" mt="4">
                <For each={NAVIGATIONS}>{item => (
                    <NavigationButtonGroup {...item} selected={selected === item ? (selectedSub || true) : false}/>
                )}</For>
            </Stack>
        </Box>
    )
}

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

const NavigationButtonGroup = memo(function NavigationButtonGroup(props: (typeof NAVIGATIONS)[number] & {selected: boolean | (typeof NAVIGATIONS)[number]["children"][number]}) {
    console.log("render", props.label)
    return (<>
        <Button variant="solid" color={props.selected ? undefined : "colorPalette.muted"} asChild><NextLink href={props.href}>{props.icon} {props.label}</NextLink></Button>
        {!!props.selected && <Stack gap="1" my="4" mx="1">
            <For each={props.children}>{item => (
                <Button variant={props.selected === item ? "subtle" : "solid"} size="sm" asChild><NextLink href={item.href}>{item.icon} {item.label}</NextLink></Button>
            )}</For>
        </Stack>}
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