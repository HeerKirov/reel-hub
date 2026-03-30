import type { Metadata } from "next"
import { SidePanel } from "@/components/server/layout"
import { LinkGroupFilter } from "@/components/server/filters"
import { ProjectList } from "@/components/app/project-list"
import { listProjectGame } from "@/services/project-game"
import { GameListFilter } from "@/schemas/project-game"
import { ProjectType } from "@/constants/project"
import { ONLINE_TYPE_ITEMS, PLATFORM_ITEMS } from "@/constants/game"

type SearchParams = Omit<GameListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function GameDatabase(props: { searchParams: Promise<SearchParams> }) {
    return <ProjectList searchParams={props.searchParams} type={ProjectType.GAME} list={listProjectGame} filterPanel={FilterPanel} />
}

function FilterPanel({ searchParams }: { searchParams: SearchParams }) {
    const onlineTypeItems = [{ label: "全部", value: "", color: "blue" }, ...ONLINE_TYPE_ITEMS]
    const platformItems = [{ label: "全部", value: "", color: "blue" }, ...PLATFORM_ITEMS]

    return (
        <>
            <SidePanel.FilterStackItem title="联机类型" asChild>
                <LinkGroupFilter items={onlineTypeItems} searchParams={searchParams} searchParamName="onlineType" />
            </SidePanel.FilterStackItem>
            <SidePanel.FilterStackItem title="平台" asChild>
                <LinkGroupFilter items={platformItems} searchParams={searchParams} searchParamName="platform" />
            </SidePanel.FilterStackItem>
        </>
    )
}
