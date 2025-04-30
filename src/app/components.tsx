"use client"
import React, { memo } from "react"
import NextLink from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import { SessionProvider, signIn, signOut } from "next-auth/react"
import { RiArrowDownSFill, RiHome3Line, RiLoginBoxLine, RiLogoutBoxLine } from "react-icons/ri"
import { Avatar, Box, Button, Collapsible, Heading, Menu, Portal, Stack, SystemStyleObject, Text } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"
import { NavigationItem, NAVIGATIONS, NavigationSubItem } from "@/constants/ui"

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
            <Box flex="1 1 20%" display={{base: "block", sm: "none"}}/>
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

const HorizontalMenuList = memo(function HorizontalMenuList({ selected, selectedSub }: {selected?: NavigationItem, selectedSub?: NavigationSubItem}) {
    const textStyle: SystemStyleObject = {display: {base: "none", md: "initial"}}
    const buttonStyle: SystemStyleObject = {width: {base: "9", md: "auto"}, px: {md: "2"}}
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

const VerticalMenuList = memo(function VerticalMenuList({ selected, selectedSub }: {selected?: NavigationItem, selectedSub?: NavigationSubItem}) {
    return (
        <Stack display={{base: "none", lg: "flex"}} py="1" px="2" mt="4" width="100%" overflowY="auto" overflowX="hidden">
            {NAVIGATIONS.map(item => <VerticalMenuButtonGroup key={item.href} {...item} selected={selected === item ? (selectedSub || true) : false}/>)}
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

const VerticalMenuButtonGroup = memo(function VerticalMenuButtonGroup(props: NavigationItem & {selected: boolean | NavigationSubItem}) {
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
