import type { Metadata } from "next"
import { CommentDisplay } from "@/components/app/comment-display"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { retrieveProjectGame } from "@/services/project-game"
import { retrieveComment } from "@/services/comment"
import { unwrapQueryResult } from "@/helpers/result"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const project = await retrieveProjectGame(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function GameCommentDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const project = await retrieveProjectGame(id)
    if(!project) {
        return <NotFoundScreen />
    }

    const result = await retrieveComment(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} />
    }
    if(!data) {
        return <NotFoundScreen message="尚未创建对此项目的评论" />
    }

    return <CommentDisplay type={ProjectType.GAME} project={project} comment={data} />
}

