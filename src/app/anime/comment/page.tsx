import { Metadata } from "next"
import { ListPageLayout } from "@/components/server/layout"
import { ProjectType } from "@/constants/project"
import { CommentSchema } from "@/schemas/comment"
import { countComments, listComments } from "@/services/comment"
import { Box } from "@chakra-ui/react"
import { SearchBox } from "@/components/filters"

type SearchParams = { page?: string, search?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function AnimationComment(props: {searchParams: Promise<SearchParams>}) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    const [list, total] = await Promise.all([
        listComments({type: ProjectType.ANIME, page, size: 15, search: searchParams.search}),
        countComments({type: ProjectType.ANIME, search: searchParams.search})
    ])

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{url: "/anime/comment"}}
            filter={<FilterPanel searchParams={searchParams} />}
            content={<ContentList list={list}/>}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
}

function FilterPanel({ searchParams }: {searchParams: SearchParams}) {
    return (<>
        <SearchBox value={searchParams.search} searchParamName="search"/>
    </>)
}

function ContentList({ list }: {list: CommentSchema[]}) {
    return <Box></Box>
}