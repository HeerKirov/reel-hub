"use client"
import { memo, useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RiFileEditLine, RiDeleteBinLine, RiEdit2Line, RiSaveLine, RiCloseLine } from "react-icons/ri"
import { Badge, Box, Button, Flex, IconButton, Popover, Portal, Table, Text } from "@chakra-ui/react"
import { EditorWithTabLayout } from "@/components/layout"
import { DateTimePicker, NumberInput } from "@/components/form"
import { ProjectDetailSchema } from "@/schemas/project"
import { RecordDetailSchema, RecordProgressDetailItem } from "@/schemas/record"
import { deleteRecord } from "@/services/record"
import { deleteProgress, updateLatestProgress } from "@/services/record-progress"
import { handleActionResult } from "@/helpers/action"
import { ProjectType } from "@/constants/project"
import { VALUE_TO_RECORD_STATUS, VALUE_TO_FOLLOW_TYPE } from "@/constants/record"

export function RecordEditor({ type, project, record }: {type: ProjectType, project: ProjectDetailSchema, record: RecordDetailSchema}) {
    const router = useRouter()

    const breadcrumb = {
        url: `/${type.toLowerCase()}/record/${project.id}`,
        detail: project.title,
        detailIcon: <RiFileEditLine/>
    }

    const tabs = [{label: "进度", icon: <RiFileEditLine/>, content: <ProgressTab type={type} record={record} project={project}/>}]

    const onComplete = () => {
        router.replace(`/${type.toLowerCase()}/record/${project.id}`)
    }

    const onDelete = async () => {
        const result = handleActionResult(
            await deleteRecord(project.id),
            { successTitle: "记录已删除" }
        )
        if(!result.ok) return
        router.back()
    }

    return <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onComplete={onComplete} onDelete={onDelete} deleteOptions={{confirmation: "确认要删除当前项目的整个记录吗？此操作无法恢复。", countdown: 3}}/>
}

function ProgressTab({ type, record, project }: {type: ProjectType, record: RecordDetailSchema, project: ProjectDetailSchema}) {
    return (
        <Box>
            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>序号</Table.ColumnHeader>
                        <Table.ColumnHeader>状态</Table.ColumnHeader>
                        <Table.ColumnHeader>开始时间</Table.ColumnHeader>
                        <Table.ColumnHeader>结束时间</Table.ColumnHeader>
                        {type === ProjectType.ANIME && <Table.ColumnHeader>已观看集数</Table.ColumnHeader>}
                        {type === ProjectType.ANIME && <Table.ColumnHeader>追番类型</Table.ColumnHeader>}
                        <Table.ColumnHeader width="80px"></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {record.progresses.toReversed().map((progress) => (
                        <ProgressTableRow key={progress.ordinal} progress={progress} type={type} projectId={project.id}/>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    )
}

const ProgressTableRow = memo(function ProgressTableRow({ progress, type, projectId }: { progress: RecordProgressDetailItem, type: ProjectType, projectId: string }) {
    const router = useRouter()
    const [editMode, setEditMode] = useState<boolean>(false)
    const [isPending, startTransition] = useTransition()

    const deleteClick = useCallback(async () => {
        if(isPending) return

        startTransition(async () => {
            const result = handleActionResult(
                await deleteProgress(projectId, progress.ordinal),
                { successTitle: "进度已删除" }
            )
            if(!result.ok) return
            router.refresh()
        })
    }, [isPending, projectId, progress.ordinal])

    const editClick = useCallback(() => {
        setEditMode(true)
    }, [])

    const backClick = useCallback(() => {
        setEditMode(false)
    }, [])

    if(editMode) {
        return <ProgressTableRowEdit progress={progress} type={type} projectId={projectId} onBack={backClick}/>
    }

    return (
        <Table.Row>
            <Table.Cell fontWeight="bold">{progress.ordinal}</Table.Cell>
            <Table.Cell>
                <Badge colorPalette={VALUE_TO_RECORD_STATUS[progress.status].color} fontSize="sm" px="2" py="1">
                    {VALUE_TO_RECORD_STATUS[progress.status].label}
                </Badge>
            </Table.Cell>
            <Table.Cell>
                {progress.startTime ? progress.startTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"}) : "-"}
            </Table.Cell>
            <Table.Cell>
                {progress.endTime ? progress.endTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"}) : "-"}
            </Table.Cell>
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
                <Flex gap="1">
                    <Popover.Root lazyMount>
                        <Popover.Trigger asChild>
                            <IconButton variant="ghost" size="sm" colorPalette="red" loading={isPending}>
                            <RiDeleteBinLine/>
                        </IconButton>
                        </Popover.Trigger>
                        <Portal>
                            <Popover.Positioner>
                                <Popover.Content width="225px">
                                    <Popover.Arrow />
                                    <Popover.Body>
                                        确认要删除此进度吗？此操作无法恢复。
                                        <p>
                                            <Button variant="outline" width="full" colorPalette="red" size="sm" mt="2" onClick={deleteClick} loading={isPending} disabled={isPending}><RiDeleteBinLine/> 删除</Button>
                                        </p>
                                    </Popover.Body>
                                </Popover.Content>
                            </Popover.Positioner>
                        </Portal>
                    </Popover.Root>
                    
                    {progress.isLatest && <IconButton variant="ghost" size="sm" colorPalette="blue" onClick={editClick} loading={isPending}>
                        <RiEdit2Line/>
                    </IconButton>}
                </Flex>
            </Table.Cell>
        </Table.Row>
    )
})

const ProgressTableRowEdit = memo(function ProgressTableRowEdit({ progress, type, projectId, onBack }: { progress: RecordProgressDetailItem, type: ProjectType, projectId: string, onBack: () => void }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [startTime, setStartTime] = useState<string | null>(progress.startTime ? progress.startTime.toISOString() : null)
    const [endTime, setEndTime] = useState<string | null>(progress.endTime ? progress.endTime.toISOString() : null)
    const [episodeWatchedNum, setEpisodeWatchedNum] = useState<number | null>(progress.episodeWatchedNum ?? null)

    const saveClick = useCallback(async () => {
        if(isPending) return
        startTransition(async () => {
            const result = handleActionResult(
                await updateLatestProgress(projectId, progress.ordinal, {
                    startTime: startTime ? new Date(startTime) : null,
                    endTime: endTime ? new Date(endTime) : null,
                    episodeWatchedNum: episodeWatchedNum ?? undefined
                }),
                { successTitle: "进度已保存" }
            )
            if(result.ok) {
                onBack()
                router.refresh()
            }
        })
    }, [isPending, projectId, progress.ordinal, startTime, endTime, episodeWatchedNum])

    return (
        <Table.Row>
            <Table.Cell fontWeight="bold">{progress.ordinal}</Table.Cell>
            <Table.Cell>
                <Badge colorPalette={VALUE_TO_RECORD_STATUS[progress.status].color} fontSize="sm" px="2" py="1">
                    {VALUE_TO_RECORD_STATUS[progress.status].label}
                </Badge>
            </Table.Cell>
            <Table.Cell>
                <DateTimePicker value={startTime} onValueChange={(v) => setStartTime(v)} mode="time" placeholder="开始时间"/>
            </Table.Cell>
            <Table.Cell>
                <DateTimePicker value={endTime} onValueChange={(v) => setEndTime(v)} mode="time" placeholder="结束时间"/>
            </Table.Cell>
            {type === ProjectType.ANIME && (
                <>
                    <Table.Cell><NumberInput value={episodeWatchedNum} onValueChange={(v) => setEpisodeWatchedNum(v)} placeholder="集数" min={0}/></Table.Cell>
                    <Table.Cell>
                        {progress.followType ? (
                            <Text fontSize="sm">{VALUE_TO_FOLLOW_TYPE[progress.followType].label}</Text>
                        ) : "-"}
                    </Table.Cell>
                </>
            )}
            <Table.Cell>
                <Flex gap="1">
                    <IconButton variant="ghost" size="sm" colorPalette="green" onClick={saveClick} loading={isPending}>
                        <RiSaveLine/>
                    </IconButton>
                    <IconButton variant="ghost" size="sm" colorPalette="red" onClick={onBack} loading={isPending}>
                        <RiCloseLine/>
                    </IconButton>
                </Flex>
            </Table.Cell>
        </Table.Row>
    )
})