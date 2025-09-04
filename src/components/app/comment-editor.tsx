"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileEditLine } from "react-icons/ri"
import { Box, Field, Text, Flex } from "@chakra-ui/react"
import { EditorWithTabLayout } from "@/components/layout"
import { Input, Starlight, Textarea } from "@/components/form"
import { ProjectDetailSchema } from "@/schemas/project"
import { CommentSchema } from "@/schemas/comment"
import { deleteComment, upsertComment } from "@/services/comment"
import { ProjectType } from "@/constants/project"
import { SCORE_DESCRIPTIONS } from "@/constants/comment"

export function CommentEditor({ type, project, comment }: {type: ProjectType, project: ProjectDetailSchema, comment: CommentSchema | null}) {
    const router = useRouter()

    const breadcrumb = {
        url: `/${type.toLowerCase()}/comment`,
        detail: project.title,
        detailIcon: <RiFileEditLine/>
    }

    const [score, setScore] = useState<number | null>(comment?.score ?? null)
    const [title, setTitle] = useState<string>(comment?.title ?? "")
    const [article, setArticle] = useState<string>(comment?.article ?? "")

    const tabs = [{label: "评价", icon: <RiFileEditLine/>, content: <CommentTab type={type} score={score} title={title} article={article} setScore={setScore} setTitle={setTitle} setArticle={setArticle}/>}]

    const onSave = async () => {
        await upsertComment(project.id, {score, title, article})
        router.push(`/${type.toLowerCase()}/comment/${project.id}`)
    }

    const onDelete = comment === null ? undefined : async () => {
        await deleteComment(project.id)
        router.push(`/${type.toLowerCase()}/database/${project.id}`)
    }

    const onCancel = () => {
        router.back()
    }

    return <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onDelete={onDelete} onCancel={onCancel}/>
}

interface CommentTabProps {
    type: ProjectType
    score: number | null
    title: string
    article: string
    setScore: (score: number | null) => void
    setTitle: (title: string) => void
    setArticle: (article: string) => void
} 

function CommentTab({ type, score, title, article, setScore, setTitle, setArticle }: CommentTabProps) {
    return <>
        <Flex mt="2" direction="column" alignItems="end">
            <Flex alignItems="center" gap="4">
                <Text fontSize="xl">{score !== null ? SCORE_DESCRIPTIONS[type][score - 1].header : "请选择评分"}</Text>
                <Starlight value={score} onValueChange={setScore}/>
            </Flex>
            <Text mt="2" mr="1" color="fg.muted" fontSize="sm">{score !== null ? SCORE_DESCRIPTIONS[type][score - 1].content : "..."}</Text>
        </Flex>
        <Field.Root>
            <Field.Label>评论</Field.Label>
            <Input value={title} onValueChange={setTitle}/>
        </Field.Root>
        <Field.Root mt="1">
            <Textarea variant="subtle" minHeight="200px" autoresize value={article} onValueChange={setArticle}/>
        </Field.Root>
    </>
}
