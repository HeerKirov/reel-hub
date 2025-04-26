import { memo } from "react"
import NextLink from "next/link"
import {
    Box, Text, Image, SimpleGrid, Flex, SystemStyleObject
} from "@chakra-ui/react"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { PageRouter } from "@/components/server/filters"

type SearchParams = { page?: string }

export default async function AnimationDatabase(props: {searchParams: Promise<SearchParams>}) {
    return (<>
        <NavigationBreadcrumb url="/anime/database"/>

        <Flex flexWrap={{base: "wrap", md: "nowrap"}} gap="2">
            <QueryBox flex="1 0 auto" order={{base: 0, md: 1}} width={{base: "100%", md: "210px", lg: "220px", xl: "240px"}} searchParams={props.searchParams}/>
            <ContentGrid flex="1 1 100%"/>
        </Flex>
    </>)
}

const QueryBox = memo(async function QueryBox({ searchParams, ...attrs }: {searchParams: Promise<SearchParams>} & SystemStyleObject) {
    const params = await searchParams
    const page = params.page !== undefined ? parseInt(params.page) : 1

    return (<Box {...attrs}>
        <Box p="2" borderWidth="1px" rounded="md">
            1
        </Box>
        <PageRouter mt="2" page={page} total={5} searchParams={params}/>
        <Text textAlign={{base: "center", md: "left"}}>共 100 条记录</Text>
    </Box>)
})

const ContentGrid = memo(function ContentGrid({ ...attrs }: SystemStyleObject) {
    const list: {id: number, title: string, image?: string}[] = [
        {id: 1, title: "顶尖恶路", image: "/ex1.webp"},
        {id: 2, title: "金牌得主", image: "/ex4.webp"},
        {id: 3, title: "Slow Loop", image: "/ex2.webp"},
        {id: 4, title: "海猫鸣泣之时", image: "/ex5.jpeg"},
        {id: 5, title: "机动战士高达GQuuuuuuX", image: "/ex6.jpg"},
    ]

    return (
        <SimpleGrid {...attrs} columns={{base: 3, sm: 4, xl: 5}} gap="2">
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
})