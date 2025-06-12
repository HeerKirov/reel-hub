import NextLink from "next/link"
import { Text, Image, Table, HStack, Tag, Link, Flex, Icon, Box, Stat, Badge, SimpleGrid, Button } from "@chakra-ui/react"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { RiChatQuoteFill, RiEdit2Line, RiPushpin2Fill } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { Starlight } from "@/components/form"
import { retrieveProjectAnime } from "@/services/anime"
import { AnimeDetailSchema } from "@/schemas/anime"
import { VALUE_TO_RATING_SEX, VALUE_TO_RATING_VIOLENCE, VALUE_TO_REGION } from "@/constants/project"
import { VALUE_TO_BOARDCAST_TYPE, VALUE_TO_ORIGINAL_TYPE } from "@/constants/anime"
import emptyCover from "@/assets/empty.jpg"
import { RelationDisplay } from "@/components/app/project-display"

export async function generateMetadata({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params
    const data = await retrieveProjectAnime(id)
    if(!data) {
        throw new Error("404 Not Found")
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function AnimationDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const data = await retrieveProjectAnime(id)
    if(!data) {
        throw new Error("404 Not Found")
    }

    return (
        <DetailPageLayout
            breadcrumb={{url: "/anime/database", detail: data.title || "(未命名)"}}
            header={<Header id={id} title={data.title || "(未命名)"}/>}
            side={<Side data={data}/>}
            content={<Content data={data}/>}
        />
    )
}

function Header({ id, title }: {id: string, title: string}) {
    return (
        <>
            <Button variant="outline" float="right" width={{base: "40px", sm: "auto"}} asChild><NextLink href={`/anime/database/${id}/edit`}><RiEdit2Line/><Text display={{base: "none", sm: "inline"}}>编辑</Text></NextLink></Button>
            {title}
        </>
    )
}

function Side({ data }: {data: AnimeDetailSchema}) {
    return (
        <>
            <Image aspectRatio={5 / 7} width="100%" src={data.resources.cover ?? emptyCover.src} alt={data.title || "(未命名)"}/>
            <Table.Root size="sm">
                <Table.Body>
                    <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">标题</Table.Cell>
                        <Table.Cell>{data.title || "(未命名)"}</Table.Cell>
                    </Table.Row>
                    {data.subtitles.length > 0 && <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">其他标题</Table.Cell>
                        <Table.Cell>
                            {data.subtitles.map(subtitle => <Text key={subtitle}>{subtitle}</Text>)}
                        </Table.Cell>
                    </Table.Row>}
                    <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">地区</Table.Cell>
                        <Table.Cell>{data.region !== null ? VALUE_TO_REGION[data.region].label : "(无)"}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell borderBottomWidth="0" textWrap="nowrap" textAlign="right">放送时间</Table.Cell>
                        <Table.Cell borderBottomWidth="0">{data.publishTime ?? "(无)"}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </>
    )
}

function Content({ data }: {data: AnimeDetailSchema}) {
    const { tags, staffs, relationsTopology } = data
    const ratingS = data.ratingS !== null ? VALUE_TO_RATING_SEX[data.ratingS] : null
    const ratingV = data.ratingV !== null ? VALUE_TO_RATING_VIOLENCE[data.ratingV] : null

    return (
        <>
            <HStack my="2">
                {data.keywords.map(k => <Tag.Root key={k} size="lg" variant="outline">
                    <Tag.Label>{k}</Tag.Label>
                </Tag.Root>)}
                {tags.map(tag => <Tag.Root key={tag.id} size="lg" asChild>
                    <NextLink href={`/anime/database/tags/${encodeURIComponent(tag.name)}`}>
                        <Tag.Label>{tag.name}</Tag.Label>
                    </NextLink>
                </Tag.Root>)}
            </HStack>
            <WrappedText text={data.description} />
            <Box display="flex" flexWrap={{base: "wrap", md: "nowrap"}} justifyContent="space-between" textAlign="center">
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2" color={data.boardcastType !== null ? `${VALUE_TO_BOARDCAST_TYPE[data.boardcastType].color}.fg` : undefined}>
                    {data.boardcastType !== null ? VALUE_TO_BOARDCAST_TYPE[data.boardcastType].label : "(未知放送类型)"}
                    <Text fontWeight="700">每集{data.episodeDuration ?? "?"}分钟</Text>
                </Box>
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2">
                    {data.episodePublishedNum >= data.episodeTotalNum ? "已完结" : "放送中"}
                    <Text fontWeight="700">{data.episodePublishedNum >= data.episodeTotalNum ? `共${data.episodeTotalNum}话` : `${data.episodePublishedNum}/${data.episodeTotalNum}话`}</Text>
                </Box>
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2" color={data.originalType !== null ? `${VALUE_TO_ORIGINAL_TYPE[data.originalType].color}.fg` : undefined}>
                    <Text>改编类型</Text>
                    <Text fontWeight="700">{data.originalType !== null ? VALUE_TO_ORIGINAL_TYPE[data.originalType].label : "(未知改编类型)"}</Text>
                </Box>
                <Box flexBasis={{base: "50%", md: "20%"}} borderBottomWidth="1px" p="2" color={ratingS !== null ? `${ratingS.color}.fg` : undefined}>
                    <Icon><PiGenderIntersexBold/></Icon>
                    <Text fontWeight="700">{ratingS !== null ? ratingS.label : "(无)"}</Text>
                </Box>
                <Box flexBasis={{base: "50%", md: "20%"}} borderBottomWidth="1px" p="2" color={ratingV !== null ? `${ratingV.color}.fg` : undefined}>
                    <Icon><PiKnifeFill/></Icon>
                    <Text fontWeight="700">{ratingV !== null ? ratingV.label : "(无)"}</Text>
                </Box>
            </Box>
            <Table.Root mb="2" width={{base: "full", sm: "auto"}} size="sm">
                <Table.Body>
                    {staffs.map(staff => <Table.Row key={staff.type}>
                        <Table.Cell>{staff.type}</Table.Cell>
                        <Table.Cell>
                            <HStack>
                                {staff.members.map(member => <Link key={member.id} colorPalette="blue" asChild>
                                    <NextLink href={`/anime/database/staff/${encodeURIComponent(member.name)}`}>{member.name}</NextLink>
                                </Link>)}
                            </HStack>
                        </Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table.Root>
            <Flex mt="4" width="full" justifyContent="stretch" gap="2" flexWrap={{base: "wrap", md: "nowrap"}}>
                <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3">
                    <Text color="blue.fg"><Icon><RiPushpin2Fill/></Icon> 已订阅</Text>
                    <Flex mt="2">
                        <Stat.Root>
                            <Stat.Label>进度</Stat.Label>
                            <HStack>
                                <Stat.ValueText>5 / 12</Stat.ValueText>
                                <Badge>{Math.floor(5 / 12 * 100)}%</Badge>
                            </HStack>
                        </Stat.Root>
                        <Stat.Root>
                            <Stat.Label>上一集在</Stat.Label>
                            <Stat.HelpText>2025年5月10日</Stat.HelpText>
                        </Stat.Root>
                    </Flex>
                </Box>
                <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3">
                    <Starlight value={10} disabled/>
                    <Text mt="2" fontWeight="500"><Icon mr="2"><RiChatQuoteFill/></Icon>这是一份评论的标题</Text>
                    <Text mt="1" color="fg.muted" fontSize="sm">这是一部份评论的内容……</Text>
                </Box>
            </Flex>
            <RelationDisplay relations={relationsTopology}/>
        </>
    )
}