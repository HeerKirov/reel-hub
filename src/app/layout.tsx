import React from "react"
import type { Metadata } from "next"
import { Box, Container, SystemStyleObject } from "@chakra-ui/react"
import { getSession } from "@/helpers/next"
import { NavigationSideBar, Wrapper, TimezoneAutoWriter } from "./components"
import { retrieveUserPreference } from "@/services/user-preference"
import "./globals.css"

export const metadata: Metadata = {
    title: {
        template: "%s | REEL HUB",
        default: "REEL HUB",
    },
    description: "Hub for ACGN entertainment.",
    authors: {url: "https://github.com/HeerKirov", name: "Heer Kirov"}
}

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
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
    const isLogin = !!session?.user
    const preferenceResult = isLogin ? await retrieveUserPreference() : null
    const preference = preferenceResult?.ok ? preferenceResult.value : null
    const autoTimezoneEnabled = isLogin && (preference?.autoTimezone ?? false)
    
    const contentBase: SystemStyleObject = {mt: "50px"}
    const contentLg: SystemStyleObject = {ml: "60px", mt: "0"}
    const contentXl: SystemStyleObject = {ml: "200px"}

    return (<>
        {autoTimezoneEnabled && <TimezoneAutoWriter currentTimezone={preference?.timezone ?? null} />}
        <Box {...contentBase} lg={contentLg} xl={contentXl}>
            <Container>
                {children}
            </Container>
        </Box>
        <NavigationSideBar avatar={session?.user ? {name: session.user.name, image: session.user.image ?? undefined} : undefined}/>
    </>)
}