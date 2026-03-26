import NextLink from "next/link"
import { RiPriceTag3Line } from "react-icons/ri"
import { Table, Tag, Text } from "@chakra-ui/react"
import { ListPageLayout } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { ProjectType } from "@/constants/project"
import { TagSchema } from "@/schemas/tag"
import { listTags } from "@/services/tag"
import { unwrapQueryResult } from "@/helpers/result"
import { InlineError } from "@/components/app/inline-error"

export type TagListSearchParams = { page?: string, search?: string }

export async function TagList(props: { searchParams: Promise<TagListSearchParams>, type: ProjectType }) {
    const type = props.type
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    const listResult = await listTags({ type, page, size: 15, search: searchParams.search })
    const { data, error } = unwrapQueryResult(listResult)

    if(error) {
        return <InlineError error={error} />
    }
    const { list, total } = data

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{ url: `/${type.toLowerCase()}/database`, detail: "标签", detailIcon: <RiPriceTag3Line /> }}
            filter={<FilterPanel searchParams={searchParams} />}
            content={<ContentTable list={list} />}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
}

function FilterPanel({ searchParams }: { searchParams: TagListSearchParams }) {
    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search" />
        </>
    )
}

function ContentTable({ list }: { list: TagSchema[] }) {
    return (
        <Table.Root size="sm">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader minW="120px">标签</Table.ColumnHeader>
                    <Table.ColumnHeader>描述</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {list.map(item => (
                    <Table.Row key={item.id}>
                        <Table.Cell fontWeight="medium">
                            <Tag.Root size="sm" asChild>
                                <NextLink href={`/anime/database/tags/${item.id}`}>
                                    <Tag.Label>{item.name}</Tag.Label>
                                </NextLink>
                            </Tag.Root>
                        </Table.Cell>
                        <Table.Cell>
                            {item.description
                                ? <Text color="fg.muted" lineClamp={4} whiteSpace="pre-wrap">{item.description}</Text>
                                : <Text color="fg.subtle">—</Text>}
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    )
}
