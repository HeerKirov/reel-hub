import NextLink from "next/link"
import { Box, Text, Image, SimpleGrid, SystemStyleObject, Button, Icon, IconButton } from "@chakra-ui/react"
import { RiAddLine, RiPriceTag3Line, RiUser2Line } from "react-icons/ri"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { PublishTimePicker, SearchBox, TagPicker, StaffPicker } from "@/components/filters"
import { LinkGroupFilter, PublishTimeFilterHeader, StaffFilterHeader, TagFilterHeader } from "@/components/server/filters"
import { InlineError } from "@/components/app/inline-error"
import { ProjectListFilter, ProjectListSchema } from "@/schemas/project"
import { ListResult, Result } from "@/schemas/all"
import { ListProjectError } from "@/schemas/error"
import { RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, ProjectType } from "@/constants/project"
import { hasPermission } from "@/helpers/next"
import { unwrapQueryResult } from "@/helpers/result"
import emptyCover from "@/assets/empty.svg"

type CommonSearchParams = Omit<ProjectListFilter, "page" | "size">

type ProjectListSearchParams<P extends CommonSearchParams> = P & { page?: string }

interface ProjectListProps<P extends CommonSearchParams, RES extends ProjectListSchema, E extends ListProjectError> {
    searchParams: Promise<ProjectListSearchParams<P>>
    type: ProjectType
    list: (filter: P & {page: number, size: number}) => Promise<Result<ListResult<RES>, E>>
    filterPanel?: (props: {searchParams: ProjectListSearchParams<P>}) => React.ReactNode
}

export async function ProjectList<P extends CommonSearchParams, RES extends ProjectListSchema, E extends ListProjectError>(props: ProjectListProps<P, RES, E>) {
    const { page: pageStr, ...searchParams } = await props.searchParams
    const page = pageStr !== undefined ? parseInt(pageStr) : 1    

    const listResult = await props.list({...(searchParams as P), page, size: 15})
    const { data, error } = unwrapQueryResult(listResult)

    if(error) {
        return <InlineError error={error}/>
    }
    const { list, total } = data
    const isAdmin = await hasPermission("admin")

    return (
        <ListPageLayout
            searchParams={searchParams as P}
            breadcrumb={{url: `/${props.type.toLowerCase()}/database`}}
            bar={<>
                <IconButton variant="ghost" size="sm" asChild><NextLink href={`/${props.type.toLowerCase()}/database/tags`}><RiPriceTag3Line/></NextLink></IconButton>
                <IconButton variant="ghost" size="sm" asChild><NextLink href={`/${props.type.toLowerCase()}/database/staff`}><RiUser2Line/></NextLink></IconButton>
                <Box flex="1 1 100%"/>
                {isAdmin && <Button variant="ghost" size="sm" asChild><NextLink href={`/${props.type.toLowerCase()}/database/new`}><RiAddLine/> 新建</NextLink></Button>}
            </>}
            filter={<FilterPanel searchParams={searchParams as P} type={props.type} filterPanel={props.filterPanel} />}
            content={<ContentGrid list={list} type={props.type}/>}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
}

function FilterPanel<P extends CommonSearchParams>({ searchParams, type, filterPanel }: {searchParams: ProjectListSearchParams<P>, type: ProjectType, filterPanel?: (props: {searchParams: ProjectListSearchParams<P>}) => React.ReactNode}) {
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
                {filterPanel?.({searchParams})}
                <SidePanel.FilterStackItem title={<><Icon><PiGenderIntersexBold/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingSexItems} searchParams={searchParams} searchParamName="ratingS"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title={<><Icon><PiKnifeFill/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingViolenceItems} searchParams={searchParams} searchParamName="ratingV"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackCollapseItem 
                    title={type === ProjectType.ANIME ? "放送时间" : type === ProjectType.MOVIE ? "上映时间" : "发行时间"}
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

function ContentGrid({ list, type, ...attrs }: {list: ProjectListSchema[], type: ProjectType} & SystemStyleObject) {
    return (
        <SimpleGrid gap="3" {...attrs} columns={{base: 3, sm: 4, xl: 5}}>
            {list.map(item => <Box key={item.id}>
                <NextLink href={`/${type.toLowerCase()}/database/${item.id}`}>
                    <Box  rounded="md" borderWidth="1px" overflow="hidden">
                        <Image aspectRatio={5 / 7} width="100%" src={item.resources.cover ?? emptyCover.src} alt={item.title || "(未命名)"}/>
                    </Box>
                    <Text pb="2">{item.title || "(未命名)"}</Text>
                </NextLink>
            </Box>)}
        </SimpleGrid>
    )
}