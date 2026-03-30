import type { Metadata } from "next"
import { SidePanel } from "@/components/server/layout"
import { LinkGroupFilter } from "@/components/server/filters"
import { ProjectList } from "@/components/app/project-list"
import { listProjectAnime } from "@/services/project-anime"
import { AnimeListFilter } from "@/schemas/project-anime"
import { ProjectType } from "@/constants/project"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS } from "@/constants/anime"

type SearchParams = Omit<AnimeListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function AnimationDatabase(props: {searchParams: Promise<SearchParams>}) {
    return <ProjectList searchParams={props.searchParams} type={ProjectType.ANIME} list={listProjectAnime} filterPanel={FilterPanel}/>
}

function FilterPanel({ searchParams }: {searchParams: SearchParams}) {
    const boardcastTypeItems = [
        {label: "全部", value: "", color: "blue"},
        ...BOARDCAST_TYPE_ITEMS
    ]

    const originalTypeItems = [
        {label: "全部", value: "", color: "blue"},
        ...ORIGINAL_TYPE_ITEMS
    ]

    return (
        <>
            <SidePanel.FilterStackItem title="放送类型" asChild>
                <LinkGroupFilter items={boardcastTypeItems} searchParams={searchParams} searchParamName="boardcastType"/>
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="原作类型" asChild>
                <LinkGroupFilter items={originalTypeItems} searchParams={searchParams} searchParamName="originalType"/>
            </SidePanel.FilterStackItem>
        </>
    )
}
