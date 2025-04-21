import React from "react"
import type { Metadata } from "next"
import { Box, Container, SystemStyleObject } from "@chakra-ui/react"
import { getSession } from "@/helpers/next"
import { NavigationSideBar, Wrapper } from "./components"
import "./globals.css"

export const metadata: Metadata = {
    title: "REEL HUB",
    description: "reel hub.",
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
    const contentBase: SystemStyleObject = {mt: "40px"}
    const contentLg: SystemStyleObject = {ml: "200px", mt: "0"}

    return (<>
        <NavigationSideBar avatar={session?.user ? {name: session.user.name, image: session.user.image ?? undefined} : undefined}/>
        <Box {...contentBase} lg={contentLg}>
            <Container>
                {children}
            </Container>
        </Box>
    </>)
}