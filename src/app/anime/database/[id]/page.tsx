import NextLink from "next/link"
import { Text, Image, Table, HStack, Tag, Link, Flex, Icon, Box, Stat, Badge } from "@chakra-ui/react"
import { RiChatQuoteFill, RiPushpin2Fill } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { Starlight } from "@/components/form"

export default async function AnimationDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <DetailPageLayout
            breadcrumb={{url: "/anime/database", detail: "时光流逝，饭菜依旧美味"}}
            header="时光流逝，饭菜依旧美味"
            side={<Side/>}
            content={<Content/>}
            bottom={"bottom"}
        />
    )
}

function Side() {
    return (
        <>
            <Image roundedTop="md" aspectRatio={5 / 7} width="100%" src="/ex7.jpg" alt="title"/>
            <Table.Root size="sm" mb="1">
                <Table.Body>
                    <Table.Row>
                        <Table.Cell textWrap="nowrap">标题</Table.Cell>
                        <Table.Cell>时光流逝，饭菜依旧美味</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell textWrap="nowrap">其他标题</Table.Cell>
                        <Table.Cell>
                            <Text>日々は過ぎれど飯うまし</Text>
                            <Text>岁月流逝饭菜依旧美味</Text>
                        </Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </>
    )
}

function Content() {
    const keywords = ["PA饭"]
    const tags = ["轻百合", "社团活动", "美食"]
    const staff = [
        {name: "角色&故事原案", members: ["あっと"]},
        {name: "原作", members: ["team apa"]},
        {name: "监督", members: ["川面真也", "春水融"]},
        {name: "系列构成", members: ["比企能博"]},
        {name: "角色设计、总作画监督", members: ["满田一"]},
        {name: "动画制作", members: ["P.A.WORKS"]},
    ]
    const description = "《岁月流逝饭菜依旧美味》（日文：日々は過ぎれど飯うまし），是由P.A.WORKS制作，川面真也&春水融担任监督、比企能博担任系列构成的一部原创动画作品。\n于2025年4月12日在日本TOKYO MX等电视台放送，并有漫画等衍生作品。"
    return (
        <>
            <HStack my="2">
                {keywords.map(k => <Tag.Root key={k} size="lg" variant="outline">
                    <Tag.Label>{k}</Tag.Label>
                </Tag.Root>)}
                {tags.map(tag => <Tag.Root key={tag} size="lg" asChild>
                    <NextLink href={`/anime/database/tags/${tag}`}>
                        <Tag.Label>{tag}</Tag.Label>
                    </NextLink>
                </Tag.Root>)}
            </HStack>
            <WrappedText text={description} />
            <Table.Root my="2" width={{base: "full", sm: "auto"}} size="sm">
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
            <Flex width="full" justifyContent="stretch" gap="2" flexWrap={{base: "wrap", sm: "nowrap"}}>
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
        </>
    )
}