import { Metadata } from "next"
import { CommentList, CommentListSearchParams } from "@/components/app/comment-list"
import { ProjectType } from "@/constants/project"

export const metadata: Metadata = {
    title: "数据库"
}

export default async function AnimationComment(props: {searchParams: Promise<CommentListSearchParams>}) {
    return (
        <CommentList searchParams={props.searchParams} type={ProjectType.ANIME}/>
    )
}
