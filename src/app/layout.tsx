import React from "react"
import NextLink from "next/link"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { RiBookOpenFill, RiFilmFill, RiGamepadFill, RiImageFill, RiTvLine } from "react-icons/ri"
import { Avatar, Box, Button, Heading, Stack, SystemStyleObject, Text } from "@chakra-ui/react"
import { getSession } from "@/helpers/next"
import { LoginButton, Wrapper } from "./components"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "REEL HUB",
    description: "reel hub.",
}

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <Wrapper>
                    <Root>
                        {children}
                    </Root>
                </Wrapper>
            </body>
        </html>
    )
}

async function Root({ children }: Readonly<{children: React.ReactNode}>) {
    const session = await getSession()

    const sideBase: SystemStyleObject = {height: "40px", width: "100vw", borderBottomWidth: "1px"}
    const sideLg: SystemStyleObject = {height: "100vh", width: "200px", borderRightWidth: "1px"}
    const contentBase: SystemStyleObject = {mt: "40px"}
    const contentLg: SystemStyleObject = {ml: "200px"}

    return (<>
        <Box {...sideBase} lg={sideLg} position="fixed" left="0" top="0" textAlign="center" colorPalette="blue">
            <Heading mt="4"><NextLink href="/">REEL HUB</NextLink></Heading>

            {session?.user ? <>
                <Avatar.Root mt="4" size="xl">
                    <Avatar.Fallback name={session.user.name}/>
                    <Avatar.Image src={session.user.image ?? undefined}/>
                </Avatar.Root>
                <Text mt="1">{session.user.name}</Text>
            </> : <>
                <LoginButton mt="4"/>
            </>}

            <Stack gap="1" py="1" px="2" mt="4">
                <Button variant="ghost" asChild><NextLink href="/animation"><RiTvLine/> 动画</NextLink></Button>
                <Button variant="ghost" asChild><NextLink href="/game"><RiGamepadFill/> 游戏</NextLink></Button>
                <Button variant="ghost" asChild><NextLink href="/movie"><RiFilmFill/> 电影</NextLink></Button>
                <Button variant="ghost" asChild><NextLink href="/novel"><RiBookOpenFill/> 小说</NextLink></Button>
                <Button variant="ghost" asChild><NextLink href="/manga"><RiImageFill/> 漫画</NextLink></Button>
            </Stack>
        </Box>
        <Box {...contentBase} lg={contentLg}>
            {children}
        </Box>
    </>)
}