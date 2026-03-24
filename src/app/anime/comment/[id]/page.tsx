import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/project-anime"
import { retrieveComment } from "@/services/comment"
import { CommentDisplay } from "@/components/app/comment-display"
import { InlineError } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { unwrapQueryResult } from "@/helpers/result"

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

    const result = await retrieveComment(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    if(!data) {
        notFound()
    }

    return <CommentDisplay type={ProjectType.ANIME} project={project} comment={data}/>
}