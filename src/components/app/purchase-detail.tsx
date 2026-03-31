import NextLink from "next/link"
import { Box, Button, Flex, Image, Stat, Table, Text } from "@chakra-ui/react"
import { RiDatabase2Fill } from "react-icons/ri"
import { DetailPageLayout } from "@/components/server/layout"
import { CompactPagination } from "@/components/server/filters"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectDetailSchema } from "@/schemas/project"
import { listPurchases, retrievePurchaseSummary } from "@/services/purchase"
import { retrieveProjectGame } from "@/services/project-game"
import { unwrapQueryResult } from "@/helpers/result"
import { PurchaseDetailTable } from "./purchase-detail.client"
import emptyCover from "@/assets/empty.jpg"
import { PurchaseWithProjectSchema } from "@/schemas/purchase"
import { numbers } from "@/helpers/primitive"

export default async function PurchaseDetail(props: {id: string, searchParams: Promise<{ page?: string }>}) {
    const searchParams = await props.searchParams
    const page = searchParams.page !== undefined ? parseInt(searchParams.page, 10) : 1

    const project = await retrieveProjectGame(props.id)
    if(!project) {
        return <NotFoundScreen />
    }

    const listResult = await listPurchases({projectId: props.id, page, size: PAGE_SIZE, orderBy: "purchaseTime"})
    const { data, error } = unwrapQueryResult(listResult)
    if(error) {
        return <InlineError error={error} />
    }
    const { list, total } = data
    const totalPage = Math.ceil(total / PAGE_SIZE)

    return (
        <DetailPageLayout breadcrumb={{ url: "/game/purchase", detail: project.title || "(未命名)" }} 
            header={project.title || "(未命名)"}
            side={<Side project={project}/>}
            content={<Content projectId={props.id} list={list} totalPage={totalPage} page={page} searchParams={searchParams} total={total} />}
        />
    )
}

const PAGE_SIZE = 15

function Side({ project }: {project: ProjectDetailSchema}) {
    return (
        <>
            <Image aspectRatio={5 / 7} width="100%" src={project.resources.cover ?? emptyCover.src} alt={project.title || "(未命名)"}/>
            <Table.Root size="sm">
                <Table.Body>
                    <Table.Row>
                        <Table.Cell textWrap="nowrap" textAlign="right">标题</Table.Cell>
                        <Table.Cell>{project.title || "(未命名)"}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
            <Button variant="outline" width="100%" asChild>
                <NextLink href={`/game/database/${project.id}`}>
                    <RiDatabase2Fill/> 前往数据库页
                </NextLink>
            </Button>
        </>
    )
}

function Content({ projectId, list, totalPage, page, searchParams, total }: {projectId: string, list: PurchaseWithProjectSchema[], totalPage: number, page: number, searchParams: { page?: string }, total: number}) {
    return (
        <>
            <Summary projectId={projectId}/>
            <PurchaseDetailTable projectId={projectId} data={list}/>
            {totalPage > 0 && <Box mt="4"><CompactPagination page={page} total={totalPage} searchParams={searchParams}/></Box>}
        </>
    )
}

async function Summary({ projectId }: {projectId: string}) {
    const summaryResult = await retrievePurchaseSummary(projectId)
    const { data, error } = unwrapQueryResult(summaryResult)
    if(error) {
        return <InlineError error={error} />
    }
    return (
        <Flex border="1px solid" borderColor="border.muted" borderRadius="md" p="3" gap="2">
            <Stat.Root>
                <Stat.Label>累计消费</Stat.Label>
                <Stat.ValueText>{numbers.formatCurrency(data?.totalCost ?? 0)}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
                <Stat.Label>累计笔数</Stat.Label>
                <Stat.ValueText>{data?.totalCount ?? 0}</Stat.ValueText>
            </Stat.Root>
        </Flex>
    )
}