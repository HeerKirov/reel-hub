import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { retrieveComment } from "@/services/comment"
import { CommentEditor } from "@/components/app/comment-editor"

export async function generateMetadata({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params
    const project = await retrieveProjectAnime(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function AnimationCommentEdit({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params

    const project = await retrieveProjectAnime(id)
    if(!project) {
        notFound()
    }

    const data = await retrieveComment(project.id)

    return <CommentEditor project={project} comment={data}/>
}