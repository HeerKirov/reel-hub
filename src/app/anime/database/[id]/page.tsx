import NextLink from "next/link"
import { Text, Image, Table, HStack, Tag, Link, Flex, Icon, Box, Stat, Badge, SimpleGrid, Button } from "@chakra-ui/react"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { RiChatQuoteFill, RiEdit2Line, RiPushpin2Fill } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { Starlight } from "@/components/form"
import * as animeService from "@/services/anime"
import { AnimeDetailSchema } from "@/schemas/anime"
import { VALUE_TO_BOARDCAST_TYPE, VALUE_TO_ORIGINAL_TYPE, VALUE_TO_RATING_SEX, VALUE_TO_RATING_VIOLENCE, VALUE_TO_REGION } from "@/constants/project"
import emptyCover from "@/assets/empty.jpg"

export default async function AnimationDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const data = await animeService.retrieve(id)
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
                    <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">其他标题</Table.Cell>
                        <Table.Cell>
                            {data.subtitles.map(subtitle => <Text key={subtitle}>{subtitle}</Text>)}
                        </Table.Cell>
                    </Table.Row><Table.Row>
                    <Table.Cell textWrap="nowrap" textAlign="right">地区</Table.Cell>
                    <Table.Cell>{data.region !== null ? VALUE_TO_REGION[data.region].label : "(无)"}</Table.Cell>
                </Table.Row>
                    <Table.Row>
                        <Table.Cell borderBottomWidth="0" textWrap="nowrap" textAlign="right">放送时间</Table.Cell>
                        <Table.Cell borderBottomWidth="0">{data.publishTime}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </>
    )
}

function Content({ data }: {data: AnimeDetailSchema}) {
    const tags = ["轻百合", "社团活动", "美食"]
    const staff = [
        {name: "角色&故事原案", members: ["あっと"]},
        {name: "原作", members: ["team apa"]},
        {name: "监督", members: ["川面真也", "春水融"]},
        {name: "系列构成", members: ["比企能博"]},
        {name: "角色设计、总作画监督", members: ["满田一"]},
        {name: "动画制作", members: ["P.A.WORKS"]},
    ]
    const relations = [
        {title: "测试相关动画", image: "/ex7.jpg", id: 2, type: "同系列"},
        {title: "测试相关动画2", image: "/ex7.jpg", id: 4, type: "前作"},
    ]

    const ratingS = data.ratingS !== null ? VALUE_TO_RATING_SEX[data.ratingS] : null
    const ratingV = data.ratingV !== null ? VALUE_TO_RATING_VIOLENCE[data.ratingV] : null

    return (
        <>
            <HStack my="2">
                {data.keywords.map(k => <Tag.Root key={k} size="lg" variant="outline">
                    <Tag.Label>{k}</Tag.Label>
                </Tag.Root>)}
                {tags.map(tag => <Tag.Root key={tag} size="lg" asChild>
                    <NextLink href={`/anime/database/tags/${tag}`}>
                        <Tag.Label>{tag}</Tag.Label>
                    </NextLink>
                </Tag.Root>)}
            </HStack>
            <WrappedText text={data.description} />
            <Box display="flex" flexWrap={{base: "wrap", md: "nowrap"}} justifyContent="space-between" textAlign="center">
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2">
                    {data.boardcastType !== null ? VALUE_TO_BOARDCAST_TYPE[data.boardcastType].label : "(未知放送类型)"}
                    <p>每集{data.episodeDuration ?? "??"}分钟</p>
                </Box>
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2">
                    放送中
                    <p>5/12话</p>
                </Box>
                <Box flexBasis={{base: "33.333%", md: "20%"}} borderBottomWidth="1px" p="2">
                    <p>{data.originalType !== null ? VALUE_TO_ORIGINAL_TYPE[data.originalType].label : "(未知改编类型)"}</p>
                </Box>
                <Box flexBasis={{base: "50%", md: "20%"}} borderBottomWidth="1px" p="2" color={ratingS !== null ? `${ratingS.color}.fg` : undefined}>
                    <Icon><PiGenderIntersexBold/></Icon>
                    <p>{ratingS !== null ? ratingS.label : "(无)"}</p>
                </Box>
                <Box flexBasis={{base: "50%", md: "20%"}} borderBottomWidth="1px" p="2" color={ratingV !== null ? `${ratingV.color}.fg` : undefined}>
                    <Icon><PiKnifeFill/></Icon>
                    <p>{ratingV !== null ? ratingV.label : "(无)"}</p>
                </Box>
            </Box>
            <Table.Root mb="2" width={{base: "full", sm: "auto"}} size="sm">
                <Table.Body>
                    {staff.map(staff => <Table.Row key={staff.name}>
                        <Table.Cell>{staff.name}</Table.Cell>
                        <Table.Cell>
                            <HStack>
                                {staff.members.map(member => <Link key={member} colorPalette="blue" asChild>
                                    <NextLink href={`/anime/database/staff/${member}`}>{member}</NextLink>
                                </Link>)}
                            </HStack>
                        </Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table.Root>
            <Flex width="full" justifyContent="stretch" gap="2" flexWrap={{base: "wrap", md: "nowrap"}}>
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
            <Box borderTopWidth="1px" mt="4" pb="2">
                <Text my="2">相关动画</Text>
                <SimpleGrid gap="2" columns={{base: 1, sm: 2, md: 4}}>
                    {relations.map(relation => <Flex key={relation.id}>
                        <Image aspectRatio={1} rounded="lg" width="75px" src={relation.image} alt={relation.id.toString()}/>
                        <Box py="1" pl="2">
                            <Link asChild><NextLink href={`/anime/database/${relation.id}`}>{relation.title}</NextLink></Link>
                            <p><Badge mt="1" color="fg.muted">{relation.type}</Badge></p>
                        </Box>
                    </Flex>)}
                </SimpleGrid>
            </Box>
        </>
    )
}