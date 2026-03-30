import type { Metadata } from "next"
import { ProjectList } from "@/components/app/project-list"
import { listProjectManga } from "@/services/project-manga"
import { MangaListFilter } from "@/schemas/project-manga"
import { ProjectType } from "@/constants/project"

type SearchParams = Omit<MangaListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function MangaDatabase(props: { searchParams: Promise<SearchParams> }) {
    return <ProjectList searchParams={props.searchParams} type={ProjectType.MANGA} list={listProjectManga} />
}

