import { memo } from "react"
import NextLink from "next/link"
import { Box, Text, Image, SimpleGrid, Flex, SystemStyleObject, Stack, Button, IconButton } from "@chakra-ui/react"
import { RiAddLine, RiFilter2Line } from "react-icons/ri"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { CompactPagination } from "@/components/server/filters"
import { SearchBox } from "@/components/filters"
import { ResponsiveIf } from "@/components/logical"

type SearchParams = { page?: string, search?: string }

export default async function AnimationDatabase(props: {searchParams: Promise<SearchParams>}) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    return (<>
        <NavigationBreadcrumb url="/anime/database"/>

        <Flex flexWrap={{base: "wrap", md: "nowrap"}} gap="2">
            <FilterPanel flex="1 0 auto" order={{base: 0, md: 1}} width={{base: "100%", md: "210px", lg: "220px", xl: "240px"}} searchParams={searchParams}/>
            <ContentGrid flex="1 1 100%"/>
        </Flex>

        <ResponsiveIf show={{md: false}}>
            <CompactPagination mt="1" page={page} total={30} searchParams={searchParams}/>
            <Text textAlign="center">共 100 条记录</Text>
        </ResponsiveIf>
    </>)
}

const FilterPanel = memo(async function QueryBox({ searchParams, ...attrs }: {searchParams: SearchParams} & SystemStyleObject) {
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    return (<Box {...attrs}>
        <Box borderWidth="1px" rounded="md">
            <Button variant="ghost" size="sm" asChild><NextLink href="/anime/database/new"><RiAddLine/> 新建</NextLink></Button>
            <IconButton variant="ghost" size="sm"><RiFilter2Line/></IconButton>
        </Box>
        <ResponsiveIf show={{base: false, md: true}}>
            <Box mt="1" py="1" px="2" borderWidth="1px" rounded="md">
                <SearchBox value={searchParams.search} searchParamName="search"/>
                <Stack gap="1" mt="1">
                    <Flex alignItems="baseline">
                        <Box flex="1 0 60px" fontSize="xs" textAlign="right" pr="1">放送时间</Box>
                        <Box flex="1 1 100%">2025年</Box>
                    </Flex>
                    <Flex alignItems="baseline">
                        <Box flex="1 0 60px" fontSize="xs" textAlign="right" pr="1">分级</Box>
                        <Box flex="1 1 100%">R12</Box>
                    </Flex>
                </Stack>
            </Box>
            <CompactPagination mt="1" fullwidth page={page} total={30} searchParams={searchParams}/>
            <Text textAlign="left">共 100 条记录</Text>
        </ResponsiveIf>
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
        <SimpleGrid gap="2" {...attrs} columns={{base: 3, sm: 4, xl: 5}}>
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