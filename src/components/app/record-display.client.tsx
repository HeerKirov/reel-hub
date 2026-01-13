"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Button, CloseButton, Dialog, Flex, Icon, Text, Table, IconButton } from "@chakra-ui/react"
import { RiBookmark3Line, RiEyeCloseFill, RiPenNibFill, RiAddLine, RiDeleteBinLine, RiArrowRightLine } from "react-icons/ri"
import { ProjectType } from "@/constants/project"
import { createRecord, nextEpisode, createProgress } from "@/services/record"
import { DateTimePicker, NumberInput } from "@/components/form"
import { RecordCreateForm, RecordProgressUpsertForm } from "@/schemas/record"
import { RecordDetailSchema } from "@/schemas/record"
import { AnimeDetailSchema } from "@/schemas/anime"

export function RecordBoxDialogContent({ type, projectId }: {type: ProjectType, projectId: string}) {
    const router = useRouter()
    const [step, setStep] = useState<"select" | "supplement">("select")
    const [progressList, setProgressList] = useState<Array<{startTime: string | null, endTime: string | null, episodeWatchedNum: number | null}>>([{startTime: null, endTime: null, episodeWatchedNum: null}])
    const [loading, setLoading] = useState(false)

    const handleCreate = async (createMode: "SUBSCRIBE" | "SUPPLEMENT" | "ONLY_RECORD") => {
        if(createMode === "SUPPLEMENT") {
            setStep("supplement")
            return
        }

        setLoading(true)
        try {
            const form: RecordCreateForm = {
                createMode
            }
            await createRecord(projectId, form)
            router.push(`/${type.toLowerCase()}/record/${projectId}`)
        } catch(error) {
            console.error("Failed to create record:", error)
            alert(error instanceof Error ? error.message : "创建记录失败")
        } finally {
            setLoading(false)
        }
    }

    const handleSupplementSubmit = async () => {
        setLoading(true)
        try {
            const form: RecordCreateForm = {
                createMode: "SUPPLEMENT",
                progress: progressList.map(p => ({
                    startTime: p.startTime ? new Date(p.startTime) : null,
                    endTime: p.endTime ? new Date(p.endTime) : null,
                    episodeWatchedNum: p.episodeWatchedNum ?? undefined
                }))
            }
            await createRecord(projectId, form)
            router.push(`/${type.toLowerCase()}/record/${projectId}`)
        } catch(error) {
            console.error("Failed to create record:", error)
            alert(error instanceof Error ? error.message : "创建记录失败")
        } finally {
            setLoading(false)
        }
    }

    const addProgress = () => {
        setProgressList([...progressList, {startTime: null, endTime: null, episodeWatchedNum: null}])
    }

    const removeProgress = (index: number) => {
        setProgressList(progressList.filter((_, i) => i !== index))
    }

    const updateProgress = (index: number, field: "startTime" | "endTime" | "episodeWatchedNum", value: string | null | number | null) => {
        const newList = [...progressList]
        newList[index] = {...newList[index], [field]: value}
        setProgressList(newList)
    }

    if(step === "supplement") {
        return (
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>补齐进度</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <Text fontSize="sm" color="fg.muted" mb="4">请按时间顺序添加您的观看/游玩进度。最后一条进度可以不完整（无结束时间）。</Text>
                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>开始时间</Table.ColumnHeader>
                                <Table.ColumnHeader>结束时间</Table.ColumnHeader>
                                {type === ProjectType.ANIME && <Table.ColumnHeader>已观看集数</Table.ColumnHeader>}
                                <Table.ColumnHeader width="60px"></Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {progressList.map((progress, index) => (
                                <Table.Row key={index}>
                                    <Table.Cell>
                                        <DateTimePicker mode="time" value={progress.startTime} onValueChange={(v) => updateProgress(index, "startTime", v)} placeholder="选择开始时间"/>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <DateTimePicker mode="time" value={progress.endTime} onValueChange={(v) => updateProgress(index, "endTime", v)} placeholder="选择结束时间"/>
                                    </Table.Cell>
                                    {type === ProjectType.ANIME && (
                                        <Table.Cell>
                                            <NumberInput value={progress.episodeWatchedNum} onValueChange={(v) => updateProgress(index, "episodeWatchedNum", v)} placeholder="集数" min={0}/>
                                        </Table.Cell>
                                    )}
                                    <Table.Cell>
                                        <IconButton variant="ghost" size="sm" colorPalette="red" onClick={() => removeProgress(index)} disabled={progressList.length === 1}>
                                            <RiDeleteBinLine/>
                                        </IconButton>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    <Button variant="outline" size="sm" mt="2" onClick={addProgress}><RiAddLine/> 添加进度</Button>
                    <Flex mt="4" gap="2" justifyContent="flex-end">
                        <Button variant="outline" onClick={() => setStep("select")} disabled={loading}>返回</Button>
                        <Button variant="solid" colorPalette="blue" onClick={handleSupplementSubmit} loading={loading}>确认创建</Button>
                    </Flex>
                </Dialog.Body>
                <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                </Dialog.CloseTrigger>
            </Dialog.Content>
        )
    }

    return (
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>{type === ProjectType.ANIME ? "加入订阅" : "添加记录"}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
                <Text fontSize="md" textAlign="center">以何种方式添加记录？</Text>
                <Flex my="4" gap="2" textAlign="center">
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiBookmark3Line/></Icon>
                        <Text>{{
                            [ProjectType.ANIME]: "从头开始观看",
                            [ProjectType.GAME]: "第一次游玩",
                            [ProjectType.MANGA]: "从头开始阅读",
                            [ProjectType.MOVIE]: "第一次观看",
                            [ProjectType.NOVEL]: "从头开始阅读",
                        }[type]}</Text>
                        <Button variant="solid" colorPalette="blue" size="sm" mt="2" onClick={() => handleCreate("SUBSCRIBE")} loading={loading}>{type === ProjectType.ANIME ? "订阅" : "新进度"}</Button>
                    </Box>
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiPenNibFill/></Icon>
                        <Text>早就{type === ProjectType.GAME ? "玩" : "看"}过了？</Text>
                        <Button variant="subtle" size="sm" mt="2" onClick={() => handleCreate("SUPPLEMENT")} loading={loading}>补齐进度</Button>
                    </Box>
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiEyeCloseFill/></Icon>
                        <Text>只是随便看看</Text>
                        <Button variant="subtle" size="sm" mt="2" onClick={() => handleCreate("ONLY_RECORD")} loading={loading}>仅创建记录</Button>
                    </Box>
                </Flex>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
            </Dialog.CloseTrigger>
        </Dialog.Content>
    )
}

export function RecordDisplayActions({ 
    record, 
    type, 
    project,
    projectId
}: {
    record: RecordDetailSchema
    type: ProjectType
    project: AnimeDetailSchema | null
    projectId: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const latestProgress = record.progresses.length > 0 ? record.progresses[record.progresses.length - 1] : null
    const isLatestComplete = latestProgress?.endTime !== null

    const handleNext = async () => {
        if(type !== ProjectType.ANIME) return
        
        setLoading(true)
        try {
            await nextEpisode(projectId)
            router.refresh()
        } catch(error) {
            console.error("Failed to next episode:", error)
            alert(error instanceof Error ? error.message : "步进失败")
        } finally {
            setLoading(false)
        }
    }

    const handleNewProgress = async () => {
        setLoading(true)
        try {
            const form: RecordProgressUpsertForm = {}
            await createProgress(projectId, form)
            router.refresh()
        } catch(error) {
            console.error("Failed to create progress:", error)
            alert(error instanceof Error ? error.message : "创建进度失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* NEXT按钮和已看完信息 */}
            {latestProgress && !isLatestComplete && type === ProjectType.ANIME && (
                <Flex alignItems="center" gap="4" flexWrap="wrap">
                    <Button variant="outline" size="sm" onClick={handleNext} loading={loading}>
                        <Icon><RiArrowRightLine/></Icon>
                        NEXT {project && latestProgress.episodeWatchedNum !== null ? `第${latestProgress.episodeWatchedNum + 1}话` : "下一步"}
                    </Button>
                </Flex>
            )}

            {/* 操作按钮 */}
            <Flex gap="2">
                <Button variant="outline" size="sm" onClick={handleNewProgress} loading={loading}>
                    <Icon><RiAddLine/></Icon>
                    新建进度
                </Button>
            </Flex>
        </>
    )
}
