import { Metadata } from "next"
import { TagList, TagListSearchParams } from "@/components/app/tag-list"
import { ProjectType } from "@/constants/project"

export const metadata: Metadata = {
    title: "标签"
}

export default async function MangaDatabaseTags(props: { searchParams: Promise<TagListSearchParams> }) {
    return <TagList searchParams={props.searchParams} type={ProjectType.MANGA} />
}

