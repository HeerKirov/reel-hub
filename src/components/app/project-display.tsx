import NextLink from "next/link"
import { Text, Image, Table, HStack, Tag, Link, Flex, Icon, Box, Button } from "@chakra-ui/react"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { RiEdit2Line } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { RelationDisplay } from "@/components/display"
import { CommentBox } from "@/components/app/comment-display"
import { RecordBox } from "@/components/app/record-display"
import { NotFoundScreen } from "@/components/app/inline-error"
import { ProjectDetailSchema } from "@/schemas/project"
import { ProjectType, VALUE_TO_RATING_SEX, VALUE_TO_RATING_VIOLENCE, VALUE_TO_REGION } from "@/constants/project"
import { getUserIdOrNull, hasPermission } from "@/helpers/next"
import emptyCover from "@/assets/empty.svg"

export interface ProjectDisplayProps<RES extends ProjectDetailSchema> {
    id: string
    type: ProjectType
    retrieve: (id: string) => Promise<RES | null>
    boxBar?: (props: {data: RES, isLogin: boolean}) => React.ReactNode
}

export async function ProjectDisplay<RES extends ProjectDetailSchema>({ id, type, retrieve, boxBar }: ProjectDisplayProps<RES>) {
    const data = await retrieve(id)
    if(!data) {
        return <NotFoundScreen/>
    }

    const isLogin = (await getUserIdOrNull()) !== null
    const isAdmin = await hasPermission("admin")

    return (
        <DetailPageLayout
            breadcrumb={{url: `/${type.toLowerCase()}/database`, detail: data.title || "(未命名)"}}
            header={<Header id={id} title={data.title || "(未命名)"} isAdmin={isAdmin} type={type}/>}
            side={<Side data={data} type={type}/>}
            content={<Content data={data} isLogin={isLogin} type={type} boxBar={boxBar}/>}
        />
    )
}

function Header<RES extends ProjectDetailSchema>({ id, title, isAdmin, type }: {id: string, title: string, isAdmin: boolean, type: ProjectType}) {
    return (
        <>
            {isAdmin && <Button variant="outline" float="right" width={{base: "40px", sm: "auto"}} asChild>
                <NextLink href={`/${type.toLowerCase()}/database/${id}/edit`} replace><RiEdit2Line/><Text display={{base: "none", sm: "inline"}}>编辑</Text></NextLink>
            </Button>}
            {title}
        </>
    )
}

function Side<RES extends ProjectDetailSchema>({ data, type }: {data: RES, type: ProjectType}) {
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
                        <Table.Cell borderBottomWidth="0" textWrap="nowrap" textAlign="right">{type === ProjectType.ANIME ? "放送时间" : type === ProjectType.MOVIE ? "上映时间" : "发行时间"}</Table.Cell>
                        <Table.Cell borderBottomWidth="0">{data.publishTime ?? "(无)"}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </>
    )
}

function Content<RES extends ProjectDetailSchema>({ data, isLogin, type, boxBar }: {data: RES, isLogin: boolean, type: ProjectType, boxBar?: (props: {data: RES, isLogin: boolean}) => React.ReactNode}) {
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
                    <NextLink href={`/${type.toLowerCase()}/database/tags/${tag.id}`}>
                        <Tag.Label>{tag.name}</Tag.Label>
                    </NextLink>
                </Tag.Root>)}
            </HStack>
            <WrappedText text={data.description} />
            <Box display="flex" flexWrap={{base: "wrap", md: "nowrap"}} p="3" borderBottomWidth="1px" justifyContent="space-around" textAlign="center">
                {boxBar?.({data, isLogin})}
                <Box color={ratingS !== null ? `${ratingS.color}.fg` : undefined}>
                    <Icon><PiGenderIntersexBold/></Icon>
                    <Text fontWeight="700">{ratingS !== null ? ratingS.label : "(无)"}</Text>
                </Box>
                <Box color={ratingV !== null ? `${ratingV.color}.fg` : undefined}>
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
                                    <NextLink href={`/${type.toLowerCase()}/database/staff/${member.id}`}>{member.name}</NextLink>
                                </Link>)}
                            </HStack>
                        </Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table.Root>
            {isLogin && <Flex mt="4" width="full" justifyContent="stretch" gap="2" flexWrap={{base: "wrap", md: "nowrap"}}>
                <RecordBox type={type} project={data}/>
                <CommentBox type={type} project={data}/>
            </Flex>}
            <RelationDisplay type={type} relations={relationsTopology}/>
        </>
    )
}
