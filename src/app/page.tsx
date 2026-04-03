import type { Metadata } from "next"
import NextLink from "next/link"
import { RiHome4Fill, RiKeyLine } from "react-icons/ri"
import { Box, Breadcrumb, Button, Flex, Heading, Icon, Image, Stack, Text, SystemStyleObject, HStack, Link } from "@chakra-ui/react"
import { DetailPageLayout } from "@/components/server/layout"
import { InlineError } from "@/components/app/inline-error"
import { RecordActivityItem } from "@/components/app/record-list"
import { PROJECT_TYPE_NAMES, ProjectType } from "@/constants/project"
import { RecordStatus } from "@/constants/record"
import { PROJECT_ICONS } from "@/constants/ui"
import { listRecordActivity } from "@/services/record-list"
import { listCompletedUnscoredProjects } from "@/services/comment"
import { retrieveEpisodeTimeTable } from "@/services/project"
import { listProjectAnime } from "@/services/project-anime"
import { listProjectGame } from "@/services/project-game"
import { listProjectManga } from "@/services/project-manga"
import { listProjectMovie } from "@/services/project-movie"
import { listProjectNovel } from "@/services/project-novel"
import { getDisplayTimeZone } from "@/services/user-preference-utils"
import { getUserIdOrNull } from "@/helpers/next"
import { unwrapQueryResult } from "@/helpers/result"
import { resCover } from "@/helpers/ui"
import { HomeGuestLoginButton, EpisodeTimeTable } from "./components"

export const metadata: Metadata = {
    title: "REEL HUB"
}

export default async function Home() {
    const userId = await getUserIdOrNull()

    return (
        <DetailPageLayout
            breadcrumb={{children: <Breadcrumb.Item><Breadcrumb.Link asChild><NextLink href="/"> <RiHome4Fill/> 主页</NextLink></Breadcrumb.Link></Breadcrumb.Item>}}
            content={<Content login={userId !== null}/>}
            side={<SideBar login={userId !== null}/>}
            sideStyle={{borderWidth: "0"}}
        />
    )
}

function Content({ login }: { login: boolean }) {
    return <>
        <HomeTimeTable/>
        {login && <Flex display={{base: "flex", sm: "none"}} mt="3" mb="5" direction={{base: "row", sm: "column"}} gap="3">
            <HomeAttension/>
            <HomeUncommented/>
        </Flex>}
        {login ? <HomeActivity/> : <HomeGuestDatabase/>}
    </>
}

function SideBar({ login }: { login: boolean }) {
    return login ? (
        <Box display={{base: "none", sm: "block"}}>
            <HomeLinks/>
            <Flex direction={{base: "row", sm: "column"}} gap="3" mt="3">
                <HomeAttension/>
                <HomeUncommented/>
            </Flex>
        </Box>
    ) : <HomeNotLogin display={{base: "none", sm: "block"}}/>
}

async function HomeTimeTable() {
    const result = await retrieveEpisodeTimeTable()
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    const displayTimeZone = await getDisplayTimeZone()
    return <EpisodeTimeTable groups={data ?? []} displayTimeZone={displayTimeZone}/>
}

async function HomeActivity() {
    const result = await listRecordActivity({ page: 1, size: 10 })
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    if (data.list.length === 0) {
        return <Box p="4" textAlign="center" color="fg.muted" fontSize="sm">暂无动态</Box>
    }
    return <Box>
        {data.list.map((item, idx) => <RecordActivityItem key={idx} item={item}/>)}
    </Box>
}

async function HomeGuestDatabase() {
    const PROJECT_LIST_REQ = [
        {type: ProjectType.ANIME, req: listProjectAnime},
        {type: ProjectType.GAME, req: listProjectGame},
        {type: ProjectType.MANGA, req: listProjectManga},
        {type: ProjectType.MOVIE, req: listProjectMovie},
        {type: ProjectType.NOVEL, req: listProjectNovel}
    ]

    const guestProjectRows = await Promise.all(PROJECT_LIST_REQ.map(async ({type, req}) => {
        const res = await req({ page: 1, size: 8 })
        const u = unwrapQueryResult(res)
        if(!u.data) return { type, items: [] }
        return { type, items: u.data.list.map(p => ({ id: p.id, title: p.title, resources: p.resources as Record<string, string> })) }
    }))

    return <Stack gap="3" p="3">
        {guestProjectRows.map(({ type, items }, idx) => <Box key={type} borderTopWidth={idx > 0 ? "1px" : "0"} pt="1">
            <Flex align="center" justify="space-between" gap="2" mb="2">
                <Text fontWeight="semibold" fontSize="sm">
                    <Icon mr="1">{PROJECT_ICONS[type]}</Icon>
                    {PROJECT_TYPE_NAMES[type]}
                </Text>
                <Button size="xs" variant="ghost" asChild>
                    <NextLink href={`/${type.toLowerCase()}/database`}>查看更多</NextLink>
                </Button>
            </Flex>
            {items.length === 0 ? <Text fontSize="sm" color="fg.muted">暂无条目</Text> : (
                <Flex gap="3" overflowX="auto" overflowY="hidden">
                    {items.map(item => <Box key={item.id} flex={{base: "0 0 33%", sm: "0 0 25%", md: "0 0 20%", lg: "0 0 16.67%"}}>
                        <NextLink href={`/${type.toLowerCase()}/database/${item.id}`}>
                            <Box rounded="md" borderWidth="1px" overflow="hidden">
                                <Image aspectRatio={5 / 7} width="100%" src={resCover(item.resources)} alt={item.title || "(未命名)"}/>
                            </Box>
                            <Text pb="2">{item.title || "(未命名)"}</Text>
                        </NextLink>
                    </Box>)}
                </Flex>
            )}
        </Box>)}
    </Stack>
}

function HomeNotLogin(attrs: SystemStyleObject) {
    return <Box p="3" width="100%" textAlign="center" borderWidth="1px" rounded="md" {...attrs}>
        <Icon fontSize="5xl"><RiKeyLine/></Icon>
        <Text fontSize="sm" color="fg.muted" lineHeight="tall" my="2">
            登录后可使用评论、记录动态等个人功能
        </Text>
        <HomeGuestLoginButton/>
    </Box>
}

function HomeLinks() {
    const items = [
        {type: ProjectType.ANIME, href: "/anime", links: [
            {label: "订阅", href: "/anime/subscription"},
            {label: "历史", href: "/anime/record?view=history"},
            {label: "时间线", href: "/anime/record?view=timeline"},
            {label: "评分表", href: "/anime/comment?view=table"},
        ]},
        {type: ProjectType.GAME, href: "/game", links: [
            {label: "消费记录", href: "/game/purchase"},
            {label: "时间线", href: "/game/record?view=timeline"},
            {label: "评分表", href: "/game/comment?view=table"},
        ]},
        {type: ProjectType.MOVIE, href: "/movie", links: [
            {label: "历史", href: "/movie/record?view=history"},
            {label: "时间线", href: "/movie/record?view=timeline"},
            {label: "评分表", href: "/movie/comment?view=table"},
        ]},
        {type: ProjectType.NOVEL, href: "/novel", links: [
            {label: "历史", href: "/novel/record?view=history"},
            {label: "时间线", href: "/novel/record?view=timeline"},
            {label: "评分表", href: "/novel/comment?view=table"},
        ]},
        {type: ProjectType.MANGA, href: "/manga", links: [
            {label: "历史", href: "/manga/record?view=history"},
            {label: "时间线", href: "/manga/record?view=timeline"},
            {label: "评分表", href: "/manga/comment?view=table"},
        ]},
    ]
    return <Box borderWidth="1px" rounded="md" p="3">
        <Heading as="h3" size="sm" mb="2">直达</Heading>
        <Stack gap="2">
            {items.map(item => (
                <HStack key={item.type} gap="1.5">
                    <Link key={item.href} asChild><NextLink href={item.href}><Icon>{PROJECT_ICONS[item.type]}</Icon></NextLink></Link>
                    {item.links.map(link => (
                        <Link key={link.href} fontSize="sm" asChild><NextLink href={link.href}>{link.label}</NextLink></Link>
                    ))}
                </HStack>
            ))}
        </Stack>
    </Box>
}

async function HomeAttension() {
    const result = await listRecordActivity({ specialAttention: "true", status: RecordStatus.WATCHING, page: 1, size: 15 })
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    const items = data.list.map(item => ({
        type: item.project.type,
        title: item.project.title,
        href: `/${item.project.type.toLowerCase()}/record/${item.project.id}`,
        nextEpisode: item.watchedEpisode !== null && item.totalEpisode !== null && item.watchedEpisode < item.totalEpisode ? item.watchedEpisode + 1 : null
    }))

    return <Box borderWidth="1px" rounded="md" p="3" width={{base: "50%", sm: "auto"}}>
        <Heading as="h3" size="sm" mb="2">特别关注</Heading>
        <NameList items={items} hasMore={data.total > 15}/>
    </Box>
}

async function HomeUncommented() {
    const result = await listCompletedUnscoredProjects({ page: 1, size: 15 })
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    const items = data.list.map(item => ({
        type: item.type,
        title: item.title,
        href: `/${item.type.toLowerCase()}/comment/${item.id}`,
        nextEpisode: null
    }))

    return <Box borderWidth="1px" rounded="md" p="3" width={{base: "50%", sm: "auto"}}>
        <Heading as="h3" size="sm" mb="2">亟待评论</Heading>
        <NameList items={items} hasMore={data.total > 15}/>
    </Box>
}

function NameList({ items, hasMore }: { items: { type: ProjectType, title: string, href: string, nextEpisode: number | null }[], hasMore: boolean }) {
    if(items.length === 0) {
        return <Text fontSize="sm" color="fg.muted">暂无</Text>
    }
    return (
        <Stack gap="1">
            {items.map((item, i) => (
                <Flex key={item.href} align="center" justify="space-between" fontSize="sm" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    <Link asChild>
                        <NextLink href={item.href}><Icon>{PROJECT_ICONS[item.type]}</Icon>{item.title}</NextLink>
                    </Link>
                    {item.nextEpisode !== null && <Text as="span" fontSize="xs" color="fg.muted">NEXT 第{item.nextEpisode}话</Text>}
                </Flex>
            ))}
            {hasMore && <Text fontSize="sm" color="fg.muted">…</Text>}
        </Stack>
    )
}
