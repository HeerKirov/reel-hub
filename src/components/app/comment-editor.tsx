"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileEditLine } from "react-icons/ri"
import { Field, Flex } from "@chakra-ui/react"
import { EditorWithTabLayout } from "@/components/layout"
import { Input, Starlight, Textarea } from "@/components/form"
import { ProjectDetailSchema } from "@/schemas/project"
import { CommentSchema } from "@/schemas/comment"
import { deleteComment, upsertComment } from "@/services/comment"

export function CommentEditor({ project, comment }: {project: ProjectDetailSchema, comment: CommentSchema | null}) {
    const router = useRouter()

    const breadcrumb = {
        url: "/anime/comment",
        detail: project.title,
        detailIcon: <RiFileEditLine/>
    }

    const [score, setScore] = useState<number | null>(comment?.score ?? null)
    const [title, setTitle] = useState<string>(comment?.title ?? "")
    const [article, setArticle] = useState<string>(comment?.article ?? "")

    const tabs = [{label: "评价", icon: <RiFileEditLine/>, content: <CommentTab score={score} title={title} article={article} setScore={setScore} setTitle={setTitle} setArticle={setArticle}/>}]

    const onSave = async () => {
        await upsertComment(project.id, {score, title, article})
        router.push(`/anime/comment/${project.id}`)
    }

    const onDelete = comment === null ? undefined : async () => {
        await deleteComment(project.id)
        router.push(`/anime/database/${project.id}`)
    }

    const onCancel = () => {
        router.back()
    }

    return <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onDelete={onDelete} onCancel={onCancel}/>
}

interface CommentTabProps {
    score: number | null
    title: string
    article: string
    setScore: (score: number | null) => void
    setTitle: (title: string) => void
    setArticle: (article: string) => void
} 

function CommentTab({ score, title, article, setScore, setTitle, setArticle }: CommentTabProps) {
    return <>
        <Flex gap="4" wrap={{base: "wrap", md: "nowrap"}}>
            <Field.Root flex={{base: "1 1 100%", md: "1 1 calc(66% - 8px)"}}>
                <Field.Label>评价标题</Field.Label>
                <Input value={title} onValueChange={setTitle}/>
            </Field.Root>
            <Field.Root flex={{base: "1 1 100%", md: "1 1 calc(33% - 8px)"}}>
                <Field.Label>评分</Field.Label>
                <Starlight mt="1" value={score} onValueChange={setScore}/>
            </Field.Root>
        </Flex>
        <Field.Root mt="4">
            <Field.Label>评价内容</Field.Label>
            <Textarea value={article} onValueChange={setArticle}/>
        </Field.Root>
    </>
}
