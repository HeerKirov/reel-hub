import type { Metadata } from "next"
import { ProjectList } from "@/components/app/project-list"
import { listProjectMovie } from "@/services/project-movie"
import { MovieListFilter } from "@/schemas/project-movie"
import { ProjectType } from "@/constants/project"

type SearchParams = Omit<MovieListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function MovieDatabase(props: { searchParams: Promise<SearchParams> }) {
    return <ProjectList searchParams={props.searchParams} type={ProjectType.MOVIE} list={listProjectMovie} />
}

