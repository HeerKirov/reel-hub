"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileEditLine, RiDeleteBinLine } from "react-icons/ri"
import { Box, Button, Flex, IconButton, Table, Text } from "@chakra-ui/react"
import { EditorWithTabLayout } from "@/components/layout"
import { ProjectDetailSchema } from "@/schemas/project"
import { RecordDetailSchema } from "@/schemas/record"
import { ProjectType } from "@/constants/project"
import { VALUE_TO_RECORD_STATUS, VALUE_TO_FOLLOW_TYPE } from "@/constants/record"
import { deleteProgress } from "@/services/record"

export function RecordEditor({ type, project, record }: {type: ProjectType, project: ProjectDetailSchema, record: RecordDetailSchema}) {
    const router = useRouter()

    const breadcrumb = {
        url: `/${type.toLowerCase()}/record/${project.id}`,
        detail: project.title,
        detailIcon: <RiFileEditLine/>
    }

    const tabs = [{label: "进度", icon: <RiFileEditLine/>, content: <ProgressTab type={type} record={record} project={project}/>}]

    const onSave = async () => {
        // TODO: 实现保存API
        router.push(`/${type.toLowerCase()}/record/${project.id}`)
    }

    const onCancel = () => {
        router.back()
    }

    return <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onCancel={onCancel}/>
}

function ProgressTab({ type, record, project }: {type: ProjectType, record: RecordDetailSchema, project: ProjectDetailSchema}) {
    const router = useRouter()
    const [deletingOrdinal, setDeletingOrdinal] = useState<number | null>(null)

    const handleDeleteProgress = async (ordinal: number) => {
        if(!confirm(`确定要删除第${ordinal}周目的进度吗？此操作无法恢复。`)) {
            return
        }

        setDeletingOrdinal(ordinal)
        try {
            await deleteProgress(project.id, ordinal)
            router.refresh()
        } catch(error) {
            console.error("Failed to delete progress:", error)
            alert(error instanceof Error ? error.message : "删除进度失败")
        } finally {
            setDeletingOrdinal(null)
        }
    }

    return (
        <Box>
            <Text fontSize="sm" color="fg.muted" mb="4">可以删除已有的进度记录。删除后无法恢复。</Text>
            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>周目</Table.ColumnHeader>
                        <Table.ColumnHeader>状态</Table.ColumnHeader>
                        <Table.ColumnHeader>开始时间</Table.ColumnHeader>
                        <Table.ColumnHeader>结束时间</Table.ColumnHeader>
                        {type === ProjectType.ANIME && <Table.ColumnHeader>已观看集数</Table.ColumnHeader>}
                        {type === ProjectType.ANIME && <Table.ColumnHeader>追番类型</Table.ColumnHeader>}
                        <Table.ColumnHeader width="80px"></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {record.progresses.map((progress) => (
                        <Table.Row key={progress.ordinal}>
                            <Table.Cell>{progress.ordinal}周目</Table.Cell>
                            <Table.Cell>
                                <Text fontSize="sm">{VALUE_TO_RECORD_STATUS[progress.status].label}</Text>
                            </Table.Cell>
                            <Table.Cell>{progress.startTime ? progress.startTime.toLocaleDateString() : "-"}</Table.Cell>
                            <Table.Cell>{progress.endTime ? progress.endTime.toLocaleDateString() : "-"}</Table.Cell>
                            {type === ProjectType.ANIME && (
                                <>
                                    <Table.Cell>{progress.episodeWatchedNum !== null ? progress.episodeWatchedNum : "-"}</Table.Cell>
                                    <Table.Cell>
                                        {progress.followType ? (
                                            <Text fontSize="sm">{VALUE_TO_FOLLOW_TYPE[progress.followType].label}</Text>
                                        ) : "-"}
                                    </Table.Cell>
                                </>
                            )}
                            <Table.Cell>
                                <IconButton variant="ghost" size="sm" colorPalette="red" onClick={() => handleDeleteProgress(progress.ordinal)} loading={deletingOrdinal === progress.ordinal}>
                                    <RiDeleteBinLine/>
                                </IconButton>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    )
}

