import { Metadata } from "next"
import { RiChatQuoteFill } from "react-icons/ri"
import { ListPageLayout } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { Starlight } from "@/components/form"
import { ProjectType } from "@/constants/project"
import { CommentWithProjectSchema } from "@/schemas/comment"
import { countComments, listComments } from "@/services/comment"
import { Box, Flex, Text, Icon, Avatar } from "@chakra-ui/react"
import { dates } from "@/helpers/primitive"

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

function ContentList({ list }: {list: CommentWithProjectSchema[]}) {
    return <Box>
        {list.map((item, idx) => (
            <Flex key={idx} p="3" mb="3">
                <Avatar.Root mr="2">
                    <Avatar.Fallback name={item.project.title}/>
                    <Avatar.Image src={item.project.resources["avatar"]}/>
                </Avatar.Root>
                <Box width="full">
                    <Flex lineHeight="38px" justify="space-between" align="center">
                        <Flex align="center" gap="3">
                            <Text fontSize="md" fontWeight="500">{item.project.title}</Text>
                            <Starlight value={item.score} disabled/>
                        </Flex>
                        <Text color="fg.muted" fontSize="sm">{dates.toDailyText(item.updateTime)}</Text>
                    </Flex>
                    {item.title && <Text fontWeight="600" fontSize="lg"><Icon mr="2"><RiChatQuoteFill/></Icon>{item.title}</Text>}
                    {item.article && <Text color="fg.muted" lineClamp={3}>{item.article}</Text>}
                </Box>
            </Flex>
        ))}
    </Box>
}