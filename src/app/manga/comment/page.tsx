import type { Metadata } from "next"
import { CommentList, CommentListSearchParams } from "@/components/app/comment-list"
import { ProjectType } from "@/constants/project"

export const metadata: Metadata = {
    title: "评价"
}

export default async function MangaComment(props: { searchParams: Promise<CommentListSearchParams> }) {
    return <CommentList searchParams={props.searchParams} type={ProjectType.MANGA} />
}

