import { retrieveProjectMovie } from "@/services/project-movie"
import { retrieveComment } from "@/services/comment"
import { CommentEditor } from "@/components/app/comment-editor"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { unwrapQueryResult } from "@/helpers/result"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const project = await retrieveProjectMovie(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function MovieCommentEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const project = await retrieveProjectMovie(id)
    if(!project) {
        return <NotFoundScreen />
    }

    const result = await retrieveComment(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} />
    }

    return <CommentEditor type={ProjectType.MOVIE} project={project} comment={data} />
}

