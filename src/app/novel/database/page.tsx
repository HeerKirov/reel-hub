import type { Metadata } from "next"
import { ProjectList } from "@/components/app/project-list"
import { listProjectNovel } from "@/services/project-novel"
import { NovelListFilter } from "@/schemas/project-novel"
import { ProjectType } from "@/constants/project"

type SearchParams = Omit<NovelListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function NovelDatabase(props: { searchParams: Promise<SearchParams> }) {
    return <ProjectList searchParams={props.searchParams} type={ProjectType.NOVEL} list={listProjectNovel} />
}

