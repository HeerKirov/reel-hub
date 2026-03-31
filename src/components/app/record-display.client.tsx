"use client"
import { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LuChevronDown } from "react-icons/lu"
import { Box, Button, CloseButton, Dialog, Flex, Icon, Text, Table, IconButton, ButtonProps, Menu, Group, Portal } from "@chakra-ui/react"
import { RiBookmark3Line, RiEyeCloseFill, RiPenNibFill, RiAddLine, RiDeleteBinLine, RiPushpin2Fill, RiFlightTakeoffLine, RiFileAddLine, RiCheckDoubleLine, RiPlayLine } from "react-icons/ri"
import { PlatformEditor } from "@/components/editor"
import { DateTimePicker, NumberInput } from "@/components/form"
import { RecordCreateForm } from "@/schemas/record"
import { handleActionResult } from "@/helpers/action"
import { RecordStatus } from "@/constants/record"
import { ProjectType, isEpisodeProjectType } from "@/constants/project"
import { createRecord, updateRecord } from "@/services/record"
import { createProgress, nextEpisode, updateLatestProgress } from "@/services/record-progress"
import { dates } from "@/helpers/primitive"

export function RecordBoxDialogContent({ type, projectId }: {type: ProjectType, projectId: string}) {
    const router = useRouter()
    const [step, setStep] = useState<"select" | "supplement">("select")
    const [progressList, setProgressList] = useState<Array<{startTime: string | null, endTime: string | null, episodeWatchedNum: number | null, platform: string[]}>>([{startTime: null, endTime: null, episodeWatchedNum: null, platform: []}])
    const [loading, setLoading] = useState(false)

    const handleCreate = async (createMode: "SUBSCRIBE" | "SUPPLEMENT" | "ONLY_RECORD") => {
        if(createMode === "SUPPLEMENT") {
            setStep("supplement")
            return
        }

        setLoading(true)
        const form: RecordCreateForm = { createMode }
        const result = handleActionResult(
            await createRecord(projectId, form),
            { successTitle: "记录已创建" }
        )
        setLoading(false)
        if(!result.ok) return
        router.push(`/${type.toLowerCase()}/record/${projectId}`)
    }

    const handleSupplementSubmit = async () => {
        setLoading(true)
        const form: RecordCreateForm = {
            createMode: "SUPPLEMENT",
            progress: progressList.map(p => ({
                startTime: p.startTime ? dates.parseStandardText(p.startTime) ?? null : null,
                endTime: p.endTime ? dates.parseStandardText(p.endTime) ?? null : null,
                episodeWatchedNum: p.episodeWatchedNum ?? undefined,
                platform: p.platform ?? []
            }))
        }
        const result = handleActionResult(
            await createRecord(projectId, form),
            { successTitle: "记录已创建" }
        )
        setLoading(false)
        if(!result.ok) return
        router.push(`/${type.toLowerCase()}/record/${projectId}`)
    }

    const addProgress = () => {
        setProgressList([...progressList, {startTime: null, endTime: null, episodeWatchedNum: null, platform: []}])
    }

    const removeProgress = (index: number) => {
        setProgressList(progressList.filter((_, i) => i !== index))
    }

    const updateProgress = (index: number, field: "startTime" | "endTime" | "episodeWatchedNum" | "platform", value: string | null | number | null | string[]) => {
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
                    <Text fontSize="sm" color="fg.muted" mb="4">请按时间顺序添加您的进度。最后一条进度可以是未完成状态。</Text>
                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>开始时间</Table.ColumnHeader>
                                <Table.ColumnHeader>结束时间</Table.ColumnHeader>
                                {isEpisodeProjectType(type) && <Table.ColumnHeader>已观看集数</Table.ColumnHeader>}
                                {type === ProjectType.GAME && <Table.ColumnHeader>平台</Table.ColumnHeader>}
                                <Table.ColumnHeader width="60px"></Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {progressList.map((progress, index) => (
                                <Table.Row key={index}>
                                    <Table.Cell>
                                        <DateTimePicker mode="day" value={progress.startTime} onValueChange={(v) => updateProgress(index, "startTime", v)} placeholder="选择开始时间"/>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <DateTimePicker mode="day" value={progress.endTime} onValueChange={(v) => updateProgress(index, "endTime", v)} placeholder="选择结束时间"/>
                                    </Table.Cell>
                                    {isEpisodeProjectType(type) && (
                                        <Table.Cell>
                                            <NumberInput value={progress.episodeWatchedNum} onValueChange={(v) => updateProgress(index, "episodeWatchedNum", v)} placeholder="集数" min={0}/>
                                        </Table.Cell>
                                    )}
                                    {type === ProjectType.GAME && (
                                        <Table.Cell>
                                            <PlatformEditor compact value={progress.platform} onValueChange={(v) => updateProgress(index, "platform", v)}/>
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
                <Dialog.Title>{isEpisodeProjectType(type) ? "加入订阅" : "添加记录"}</Dialog.Title>
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
                        <Button variant="solid" colorPalette="blue" size="sm" mt="2" onClick={() => handleCreate("SUBSCRIBE")} loading={loading}>{isEpisodeProjectType(type) ? "订阅" : "新进度"}</Button>
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

export function RecordDisplayAttentionButton({ projectId, type, specialAttention }: { projectId: string, type: ProjectType, specialAttention: boolean }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const toggleClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await updateRecord(projectId, { specialAttention: !specialAttention }))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, specialAttention, isPending])
    
    return (
        <Button variant="outline" colorPalette={specialAttention ? "yellow" : undefined} size="sm" onClick={toggleClick} opacity={isPending ? 0.6 : 1}>
            <RiPushpin2Fill/> {specialAttention ? (type === ProjectType.ANIME ? "订阅中" : "特别关注") : (type === ProjectType.ANIME ? "未订阅" : "特别关注")}
        </Button>
    )
}

export function RecordDisplayNextButton({ projectId, ordinal, watched }: { projectId: string, ordinal: number, watched: number }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const nextClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await nextEpisode(projectId))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, isPending])

    const dropClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await updateLatestProgress(projectId, ordinal, { status: RecordStatus.DROPPED }))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, ordinal, isPending])

    return (
        <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Group attached>
                <Button variant="outline" size="sm" onClick={nextClick} opacity={isPending ? 0.6 : 1}>
                    <RiFlightTakeoffLine/>
                    NEXT 第{watched + 1}话
                </Button>
                <Menu.Trigger asChild>
                <IconButton variant="outline" size="sm">
                    <LuChevronDown/>
                </IconButton>
                </Menu.Trigger>
            </Group>
            <Portal>
                <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="drop" onClick={dropClick}>
                        <RiDeleteBinLine/>
                        放弃进度
                    </Menu.Item>
                </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

export function RecordDisplayFinishButton({ projectId, ordinal, ...attrs }: { projectId: string, ordinal: number } & ButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const finishClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await updateLatestProgress(projectId, ordinal, { endTime: new Date() }))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, ordinal, isPending])

    const dropClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await updateLatestProgress(projectId, ordinal, { status: RecordStatus.DROPPED }))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, ordinal, isPending])

    return (
        <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Group attached>
                <Button variant="outline" size="sm" onClick={finishClick} opacity={isPending ? 0.6 : 1} {...attrs}>
                    <RiCheckDoubleLine /> 完成
                </Button>
                <Menu.Trigger asChild>
                <IconButton variant="outline" size="sm">
                    <LuChevronDown/>
                </IconButton>
                </Menu.Trigger>
            </Group>
            <Portal>
                <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="drop" onClick={dropClick}>
                        <RiDeleteBinLine/> 放弃进度
                    </Menu.Item>
                </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

export function RecordDisplayResumeButton({ projectId, ordinal }: { projectId: string, ordinal: number } & ButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const resumeClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await updateLatestProgress(projectId, ordinal, { status: RecordStatus.WATCHING }))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, ordinal, isPending])

    return (
        <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Group attached>
                <Menu.Trigger asChild>
                <IconButton variant="outline" size="sm">
                    <LuChevronDown/>
                </IconButton>
                </Menu.Trigger>
            </Group>
            <Portal>
                <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="resume" onClick={resumeClick}>
                        <RiPlayLine/> 重拾进度
                    </Menu.Item>
                </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}

export function RecordDisplayCreateProgressButton({ projectId, ...attrs }: { projectId: string } & ButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const createProgressClick = useCallback(async () => {
        if(isPending) return
        const result = handleActionResult(await createProgress(projectId, {}))
        if(result.ok) startTransition(() => router.refresh())
    }, [projectId, isPending])

    return (
        <Button variant="outline" size="sm" onClick={createProgressClick} opacity={isPending ? 0.6 : 1} {...attrs}>
            <RiFileAddLine />
            新建进度
        </Button>
    )
}

export function RecordDisplayPlatformEditor({ projectId, ordinal, platform }: { projectId: string, ordinal: number, platform: string[] }) {
    const router = useRouter()

    const updatePlatform = useCallback(async (platform: string[]) => {
        const result = handleActionResult(await updateLatestProgress(projectId, ordinal, { platform }))
        if(result.ok) router.refresh()
    }, [projectId, ordinal])

    return (
        <PlatformEditor value={platform} withSaveButton onValueChange={updatePlatform}/>
    )
}