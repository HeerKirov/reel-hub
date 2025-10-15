import NextLink from "next/link"
import { Box, Button, Flex, Heading, Icon, Image, Table, Text } from "@chakra-ui/react"
import { RiBookmark3Line, RiChatQuoteFill, RiDatabase2Fill, RiEdit2Line } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { Starlight } from "@/components/form"
import { ProjectType } from "@/constants/project"
import { ProjectDetailSchema } from "@/schemas/project"
import { CommentSchema } from "@/schemas/comment"
import { SCORE_DESCRIPTIONS } from "@/constants/comment"
import { retrieveComment } from "@/services/comment"
import emptyCover from "@/assets/empty.jpg"

export function CommentDisplay({ type, project, comment }: {type: ProjectType, project: ProjectDetailSchema, comment: CommentSchema}) {
    const breadcrumb = {
        url: `/${type.toLowerCase()}/comment`,
        detail: project.title
    }

    return <DetailPageLayout breadcrumb={breadcrumb} 
        header={<Header id={project.id} title={project.title} type={type}/>} 
        side={<Side project={project} type={type}/>} 
        content={<Content comment={comment} type={type}/>}
    />
}

function Header({ id, title, type }: {id: string, title: string, type: ProjectType}) {
    return (
        <>
            <Button variant="outline" float="right" width={{base: "40px", sm: "auto"}} asChild><NextLink href={`/${type.toLowerCase()}/comment/${id}/edit`}><RiEdit2Line/><Text display={{base: "none", sm: "inline"}}>编辑</Text></NextLink></Button>
            {title}
        </>
    )
}

function Side({ project, type }: {project: ProjectDetailSchema, type: ProjectType}) {
    return (
        <>
            <Image aspectRatio={5 / 7} width="100%" src={project.resources.cover ?? emptyCover.src} alt={project.title || "(未命名)"}/>
            <Table.Root size="sm">
                <Table.Body>
                    <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">标题</Table.Cell>
                        <Table.Cell>{project.title || "(未命名)"}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
            <Button variant="outline" width="100%" asChild><NextLink href={`/${type.toLowerCase()}/database/${project.id}`}><RiDatabase2Fill/><Text>前往数据库页</Text></NextLink></Button>
            <Button variant="outline" width="100%" asChild><NextLink href={`/${type.toLowerCase()}/record/${project.id}`}><RiBookmark3Line/><Text>前往观看记录</Text></NextLink></Button>
        </>
    )
}

function Content({ comment, type }: {comment: CommentSchema, type: ProjectType}) {
    return (
        <>
            <Flex mt="2" direction="column" alignItems="end">
                <Flex alignItems="center" gap="4">
                    {comment.score && <Text fontSize="xl">{SCORE_DESCRIPTIONS[type][comment.score - 1].header}</Text>}
                    <Starlight value={comment.score} disabled/>
                </Flex>
                {comment.score && <Text mt="2" mr="1" color="fg.muted" fontSize="sm">{comment.score && SCORE_DESCRIPTIONS[type][comment.score - 1].content}</Text>}
            </Flex>
            <Heading mb="2"><Icon><RiChatQuoteFill/></Icon> {comment.title}</Heading>
            <WrappedText text={comment.article}/>
        </>
    )
}

export async function CommentBox({ project, type }: {project: ProjectDetailSchema, type: ProjectType}) {
    const data = await retrieveComment(project.id)
    if(!data) {
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Text color="fg.muted" fontSize="sm">未进行任何评价</Text>
                    <Button variant="solid" colorPalette="blue" size="sm" mt="2" asChild><NextLink href={`/${type.toLowerCase()}/comment/${project.id}/edit`}>编写评价</NextLink></Button>
                </Box>
            </Box>
        )
    }

    return (
        <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
            <NextLink href={`/${type.toLowerCase()}/comment/${project.id}`}>
                <Starlight value={data.score} disabled/>
                <Text mt="2" fontWeight="500"><Icon mr="2"><RiChatQuoteFill/></Icon>{data.title}</Text>
                <Text mt="1" color="fg.muted" fontSize="sm">{data.article}</Text>
            </NextLink>
        </Box>
    )
}