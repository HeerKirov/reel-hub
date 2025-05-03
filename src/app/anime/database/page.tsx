import NextLink from "next/link"
import { Box, Text, Image, SimpleGrid, SystemStyleObject, Button, Icon, Link } from "@chakra-ui/react"
import { RiAddLine } from "react-icons/ri"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { ListPageLayout, SidePanel } from "@/components/server/layout"
import { LinkGroupFilter } from "@/components/server/filters"
import { PublishTimePicker, SearchBox } from "@/components/filters"

type SearchParams = { page?: string, search?: string, ratingSex?: string, ratingViolence?: string, publishTime?: string }

export default async function AnimationDatabase(props: {searchParams: Promise<SearchParams>}) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{url: "/anime/database"}}
            bar={<>
                <Box flex="1 1 100%"/>
                <Button variant="ghost" size="sm" asChild><NextLink href="/anime/database/new"><RiAddLine/> 新建</NextLink></Button>
            </>}
            filter={<FilterPanel searchParams={searchParams} />}
            content={<ContentGrid />}
            totalRecord={100}
            totalPage={30}
            currentPage={page}
        />
    )
}

function FilterPanel({ searchParams }: {searchParams: SearchParams}) {
    const publishTypeItems = [
        {label: "全部", value: "", color: "blue"},
        {label: "TV动画", value: "tv", color: "cyan"},
        {label: "剧场版动画", value: "movie", color: "purple"},
        {label: "OVA&OAD", value: "ova", color: "orange"}
    ]

    const originalTypeItems = [
        {label: "全部", value: "", color: "blue"},
        {label: "原创", value: "original", color: "orange"},
        {label: "漫画", value: "manga", color: "pink"},
        {label: "小说", value: "novel", color: "cyan"},
        {label: "游戏", value: "game", color: "green"},
        {label: "其他", value: "other", color: "purple"}
    ]

    const ratingSexItems = [
        {label: "全部", value: "", color: "blue"},
        {label: "全年龄", value: "all", color: "green"},
        {label: "R12", value: "r12", color: "cyan"},
        {label: "R15", value: "r15", color: "purple"},
        {label: "R17", value: "r17", color: "orange"},
        {label: "R18", value: "r18", color: "red"}
    ]

    const ratingViolenceItems = [
        {label: "全部", value: "", color: "blue"},
        {label: "无限制", value: "no", color: "green"},
        {label: "A", value: "a", color: "cyan"},
        {label: "B", value: "b", color: "purple"},
        {label: "C", value: "c", color: "orange"},
        {label: "D", value: "d", color: "red"}
    ]

    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search"/>
            <SidePanel.FilterStack>
                <SidePanel.FilterStackItem title="放送类型" asChild>
                    <LinkGroupFilter items={publishTypeItems} searchParams={searchParams} searchParamName="publishType"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title="原作类型" asChild>
                    <LinkGroupFilter items={originalTypeItems} searchParams={searchParams} searchParamName="originalType"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title={<><Icon><PiGenderIntersexBold/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingSexItems} searchParams={searchParams} searchParamName="ratingSex"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackItem title={<><Icon><PiKnifeFill/></Icon> 分级</>} asChild>
                    <LinkGroupFilter items={ratingViolenceItems} searchParams={searchParams} searchParamName="ratingViolence"/>
                </SidePanel.FilterStackItem>
                <SidePanel.FilterStackCollapseItem title="放送时间" header={<PublishTimeFilterHeader publishTime={searchParams.publishTime}/>}>
                    <PublishTimePicker value={searchParams.publishTime} searchParamName="publishTime"/>
                </SidePanel.FilterStackCollapseItem>
                <SidePanel.FilterStackCollapseItem title="标签" asChild header={<Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>}>
                    泥嚎
                </SidePanel.FilterStackCollapseItem>
                <SidePanel.FilterStackCollapseItem title="STAFF" asChild header={<Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>}>
                    泥嚎
                </SidePanel.FilterStackCollapseItem>
            </SidePanel.FilterStack>
        </>
    )
}

function PublishTimeFilterHeader({ publishTime }: {publishTime?: string}) {
    if(publishTime) {
        const [year, month] = publishTime.split("-")
        const str = month ? `${year}年${month}月` : `${year}年`
        return (
            <Link variant="underline" fontWeight="700" color="blue.fg">{str}</Link>
        )
    }else{
        return (
            <Link variant="underline" fontWeight="700" color="fg.subtle">未选择</Link>
        )
    }
}

function ContentGrid({ ...attrs }: SystemStyleObject) {
    const list: {id: number, title: string, image?: string}[] = [
        {id: 1, title: "顶尖恶路", image: "/ex1.webp"},
        {id: 2, title: "金牌得主", image: "/ex4.webp"},
        {id: 3, title: "Slow Loop", image: "/ex2.webp"},
        {id: 4, title: "海猫鸣泣之时", image: "/ex5.jpeg"},
        {id: 5, title: "机动战士高达GQuuuuuuX", image: "/ex6.jpg"},
    ]

    return (
        <SimpleGrid gap="3" {...attrs} columns={{base: 3, sm: 4, xl: 5}}>
            {list.map(item => <Box key={item.id}>
                <NextLink href={`/anime/database/${item.id}`}>
                    <Box  rounded="md" borderWidth="1px" overflow="hidden">
                        <Image aspectRatio={5 / 7} width="100%" src={item.image} alt={item.title}/>
                    </Box>
                    <Text pb="2">{item.title}</Text>
                </NextLink>
            </Box>)}
        </SimpleGrid>
    )
}