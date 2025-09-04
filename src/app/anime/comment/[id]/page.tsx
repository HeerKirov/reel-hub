import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { retrieveComment } from "@/services/comment"
import { CommentDisplay } from "@/components/app/comment-display"
import { ProjectType } from "@/constants/project"

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

export default async function AnimationCommentDetail({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params

    const project = await retrieveProjectAnime(id)
    if(!project) {
        notFound()
    }

    const data = await retrieveComment(project.id)
    if(!data) {
        notFound()  
    }

    return <CommentDisplay type={ProjectType.ANIME} project={project} comment={data}/>
}