import NextLink from "next/link"
import { RiArrowDownSFill, RiChatQuoteFill, RiPenNibLine, RiStarFill } from "react-icons/ri"
import { Box, Flex, Text, Icon, Avatar, Menu, Portal, Button, Table } from "@chakra-ui/react"
import { ListPageLayout } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { Starlight } from "@/components/form"
import { ProjectType } from "@/constants/project"
import { CommentWithProjectSchema } from "@/schemas/comment"
import { countComments, listComments } from "@/services/comment"
import { dates } from "@/helpers/primitive"
import { staticHref } from "@/helpers/ui"

export type CommentListSearchParams = { page?: string, search?: string, view?: "activity" | "table" }

export async function CommentList(props: {searchParams: Promise<CommentListSearchParams>, type: ProjectType}) {
    const type = props.type
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    const [list, total] = await Promise.all([
        listComments({type, page, size: 15, search: searchParams.search, orderBy: searchParams.view === "table" ? "score" : "updateTime"}),
        countComments({type, search: searchParams.search})
    ])

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{url: `/${type.toLowerCase()}/comment`}}
            bar={<FilterBar searchParams={searchParams}/>}
            filter={<FilterPanel searchParams={searchParams} />}
            content={searchParams.view === "table" ? <ContentTable list={list} type={type}/> : <ContentActivity list={list} type={type}/>}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
}

function FilterBar({ searchParams }: {searchParams: CommentListSearchParams}) {
    return (<>
        <Menu.Root>
            <Menu.Trigger asChild>
                {searchParams.view === "table" ?
                    <Button variant="ghost" size="sm" pr="1"><RiStarFill/> 评分表 <RiArrowDownSFill/></Button>
                :
                    <Button variant="ghost" size="sm" pr="1"><RiPenNibLine/> 动态 <RiArrowDownSFill/></Button>
                }
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="activity" asChild>
                        <NextLink href={staticHref({searchParams, key: "view", value: null, removePagination: true})}>
                            <Icon><RiPenNibLine/></Icon> 动态
                        </NextLink>
                    </Menu.Item>
                    <Menu.Item value="table" asChild>
                        <NextLink href={staticHref({searchParams, key: "view", value: "table", removePagination: true})}>
                            <Icon><RiStarFill/></Icon> 评分表
                        </NextLink>
                    </Menu.Item>
                </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    </>)
}

function FilterPanel({ searchParams }: {searchParams: CommentListSearchParams}) {
    return (<>
        <SearchBox value={searchParams.search} searchParamName="search"/>
    </>)
}

function ContentActivity({ list, type }: {list: CommentWithProjectSchema[], type: ProjectType}) {
    return <Box>
        {list.map((item, idx) => (
            <Flex key={idx} m="3" asChild>
                <NextLink href={`/${type.toLowerCase()}/comment/${item.project.id}`}>
                    <Avatar.Root mr="2">
                        <Avatar.Fallback name={item.project.title}/>
                        <Avatar.Image src={item.project.resources["avatar"]}/>
                    </Avatar.Root>
                    <Box width="full">
                        <Flex lineHeight="38px" justify="space-between" align="center">
                            <Flex align="center" gap="3">
                                <Text fontSize="md" fontWeight="500">
                                    {item.project.title}
                                </Text>
                                <Starlight value={item.score} disabled/>
                            </Flex>
                            <Text color="fg.muted" fontSize="sm">{dates.toDailyText(item.updateTime)}</Text>
                        </Flex>
                        {item.title && <Text fontWeight="600" fontSize="lg"><Icon mr="2"><RiChatQuoteFill/></Icon>{item.title}</Text>}
                        {item.article && <Text color="fg.muted" lineClamp={3}>{item.article}</Text>}
                    </Box>
                </NextLink>
            </Flex>
        ))}
    </Box>
}

function ContentTable({ list, type }: {list: CommentWithProjectSchema[], type: ProjectType}) {
    return <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.ColumnHeader width="50px"></Table.ColumnHeader>
                <Table.ColumnHeader>标题</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="center">评分</Table.ColumnHeader>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {list.map((item, idx) => (
                <Table.Row key={idx}>
                    <Table.Cell>
                        <Avatar.Root size="sm">
                            <Avatar.Fallback name={item.project.title}/>
                            <Avatar.Image src={item.project.resources["avatar"]}/>
                        </Avatar.Root>
                    </Table.Cell>
                    <Table.Cell>
                        <NextLink href={`/${type.toLowerCase()}/comment/${item.project.id}`}>
                            {item.project.title}
                        </NextLink>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                        <Starlight value={item.score} disabled/>
                    </Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table.Root>
}