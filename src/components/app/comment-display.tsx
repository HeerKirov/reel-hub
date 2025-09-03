import { Text } from "@chakra-ui/react"
import { DetailPageLayout } from "@/components/server/layout"
import { WrappedText } from "@/components/server/universal"
import { Starlight } from "@/components/form"
import { ProjectDetailSchema } from "@/schemas/project"
import { CommentSchema } from "@/schemas/comment"

export function CommentDisplay({ project, comment }: {project: ProjectDetailSchema, comment: CommentSchema}) {
    const breadcrumb = {
        url: "/anime/comment",
        detail: project.title
    }

    return <DetailPageLayout breadcrumb={breadcrumb} header={project.title} content={<>
        <Text>{comment.title}</Text>
        <Starlight value={comment.score ?? 0} disabled/>
        <WrappedText>{comment.article}</WrappedText>
    </>}/>
}