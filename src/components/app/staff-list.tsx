import NextLink from "next/link"
import { RiUser2Line } from "react-icons/ri"
import { Flex, Table, Tag, Text } from "@chakra-ui/react"
import { ListPageLayout } from "@/components/server/layout"
import { SearchBox } from "@/components/filters"
import { ProjectType } from "@/constants/project"
import { StaffSchema } from "@/schemas/staff"
import { listStaffs } from "@/services/staff"
import { unwrapQueryResult } from "@/helpers/result"
import { InlineError } from "@/components/app/inline-error"

export type StaffListSearchParams = { page?: string, search?: string }

export async function StaffList(props: { searchParams: Promise<StaffListSearchParams>, type: ProjectType }) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page) : 1

    const listResult = await listStaffs({ type: props.type, page, size: 15, search: searchParams.search })
    const { data, error } = unwrapQueryResult(listResult)

    if(error) {
        return <InlineError error={error} />
    }
    const { list, total } = data

    return (
        <ListPageLayout
            searchParams={searchParams}
            breadcrumb={{ url: `/${props.type.toLowerCase()}/database`, detail: "STAFF", detailIcon: <RiUser2Line /> }}
            filter={<FilterPanel searchParams={searchParams} />}
            content={<ContentTable list={list} type={props.type} />}
            totalRecord={total}
            totalPage={Math.ceil(total / 15)}
            currentPage={page}
        />
    )
}

function FilterPanel({ searchParams }: { searchParams: StaffListSearchParams }) {
    return (
        <>
            <SearchBox value={searchParams.search} searchParamName="search" />
        </>
    )
}

function ContentTable({ list, type }: { list: StaffSchema[], type: ProjectType }) {
    return (
        <Table.Root size="sm">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader minW="120px">名称</Table.ColumnHeader>
                    <Table.ColumnHeader minW="70px">别名</Table.ColumnHeader>
                    <Table.ColumnHeader>描述</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {list.map(item => {
                    const aliases = item.otherNames.filter(name => name.trim().length > 0)
                    return (
                        <Table.Row key={item.id}>
                            <Table.Cell fontWeight="medium">
                                <NextLink href={`/${type.toLowerCase()}/database/staff/${item.id}`}>{item.name}</NextLink>
                            </Table.Cell>
                            <Table.Cell>
                                {aliases.length > 0
                                    ? (
                                        <Flex wrap="wrap" gap="1">
                                            {aliases.map(alias => (
                                                <Tag.Root key={`${item.id}-${alias}`} size="sm" variant="subtle">
                                                    <Tag.Label>{alias}</Tag.Label>
                                                </Tag.Root>
                                            ))}
                                        </Flex>
                                    )
                                    : <Text color="fg.subtle">—</Text>}
                            </Table.Cell>
                            <Table.Cell>
                                {item.description
                                    ? <Text color="fg.muted" lineClamp={4} whiteSpace="pre-wrap">{item.description}</Text>
                                    : <Text color="fg.subtle">—</Text>}
                            </Table.Cell>
                        </Table.Row>
                    )
                })}
            </Table.Body>
        </Table.Root>
    )
}
