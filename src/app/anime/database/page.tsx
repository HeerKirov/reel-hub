import NextLink from "next/link"
import type { Metadata } from "next"
import { Box, Text, Image, SimpleGrid, SystemStyleObject, Button, Icon, IconButton } from "@chakra-ui/react"
import { RiAddLine, RiPriceTag3Line, RiUser2Line } from "react-icons/ri"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { LinkGroupFilter, PublishTimeFilterHeader, StaffFilterHeader, TagFilterHeader } from "@/components/server/filters"
import { PublishTimePicker, SearchBox, TagPicker, StaffPicker } from "@/components/filters"
import { listProjectAnime, countProjectAnime } from "@/services/anime"
import { AnimeListFilter, AnimeListSchema } from "@/schemas/anime"
import { RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS } from "@/constants/project"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS } from "@/constants/anime"
import { hasPermission } from "@/helpers/next"
import emptyCover from "@/assets/empty.jpg"

type SearchParams = Omit<AnimeListFilter, "page" | "size"> & { page?: string }

export const metadata: Metadata = {
    title: "数据库"
}

export default async function AnimationDatabase(props: {searchParams: Promise<SearchParams>}) {
    const { page: pageStr, ...searchParams } = await props.searchParams
    const page = pageStr !== undefined ? parseInt(pageStr) : 1

    const isAdmin = await hasPermission("admin")

    const [list, total] = await Promise.all([
        listProjectAnime({...searchParams, page, size: 15}),
        countProjectAnime({...searchParams})
    ])

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{url: "/anime/database"}}
            bar={<>
                <IconButton variant="ghost" size="sm" asChild><NextLink href="/anime/database/tags"><RiPriceTag3Line/></NextLink></IconButton>
                <IconButton variant="ghost" size="sm" asChild><NextLink href="/anime/database/staff"><RiUser2Line/></NextLink></IconButton>
                <Box flex="1 1 100%"/>
                {isAdmin && <Button variant="ghost" size="sm" asChild><NextLink href="/anime/database/new"><RiAddLine/> 新建</NextLink></Button>}
            </>}
            filter={<FilterPanel searchParams={searchParams} />}
            content={<ContentGrid list={list}/>}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
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

    const ratingSexItems = [
        {label: "全部", value: "", color: "blue"},
        ...RATING_SEX_ITEMS
    ]

    const ratingViolenceItems = [
        {label: "全部", value: "", color: "blue"},
        ...RATING_VIOLENCE_ITEMS
    ]

    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search"/>
            <SidePanel.FilterStack>
                <SidePanel.FilterStackItem title="放送类型" asChild>
                    <LinkGroupFilter items={boardcastTypeItems} searchParams={searchParams} searchParamName="boardcastType"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title="原作类型" asChild>
                    <LinkGroupFilter items={originalTypeItems} searchParams={searchParams} searchParamName="originalType"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title={<><Icon><PiGenderIntersexBold/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingSexItems} searchParams={searchParams} searchParamName="ratingS"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title={<><Icon><PiKnifeFill/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingViolenceItems} searchParams={searchParams} searchParamName="ratingV"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackCollapseItem 
                    title="放送时间"
                    header={<PublishTimeFilterHeader publishTime={searchParams.publishTime} mode="season"/>}
                    clear={{paramName: "publishTime", searchParams}}>
                    <PublishTimePicker value={searchParams.publishTime} searchParamName="publishTime" mode="season"/>
                </SidePanel.FilterStackCollapseItem>
                <SidePanel.FilterStackCollapseItem 
                    title={<><Icon><RiPriceTag3Line/></Icon> 标签</>} 
                    header={<TagFilterHeader searchParams={searchParams}/>} 
                    clear={{paramName: "tag", searchParams}}>
                    <TagPicker/>
                </SidePanel.FilterStackCollapseItem>
                <SidePanel.FilterStackCollapseItem 
                    title={<><Icon><RiUser2Line/></Icon> STAFF</>} 
                    header={<StaffFilterHeader searchParams={searchParams}/>} 
                    clear={{paramName: "staff", searchParams}}>
                    <StaffPicker/>
                </SidePanel.FilterStackCollapseItem>
            </SidePanel.FilterStack>
        </>
    )
}

function ContentGrid({ list, ...attrs }: {list: AnimeListSchema[]} & SystemStyleObject) {
    return (
        <SimpleGrid gap="3" {...attrs} columns={{base: 3, sm: 4, xl: 5}}>
            {list.map(item => <Box key={item.id}>
                <NextLink href={`/anime/database/${item.id}`}>
                    <Box  rounded="md" borderWidth="1px" overflow="hidden">
                        <Image aspectRatio={5 / 7} width="100%" src={item.resources.cover ?? emptyCover.src} alt={item.title || "(未命名)"}/>
                    </Box>
                    <Text pb="2">{item.title || "(未命名)"}</Text>
                </NextLink>
            </Box>)}
        </SimpleGrid>
    )
}