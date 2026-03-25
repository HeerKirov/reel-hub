import NextLink from "next/link"
import { Box, Text, Icon, Flex, Stat, HStack, Badge, Button, Dialog, Portal, Heading, Image, Table, Progress } from "@chakra-ui/react"
import { RiBookmark3Line, RiPushpin2Fill, RiDatabase2Fill, RiEdit2Line, RiArrowRightLine } from "react-icons/ri"
import { ProjectType, RecordStatus } from "@/prisma/generated"
import { ProjectDetailSchema } from "@/schemas/project"
import { retrieveRecordPreview } from "@/services/record"
import { AnimeDetailSchema } from "@/schemas/anime"
import { VALUE_TO_RECORD_STATUS, VALUE_TO_FOLLOW_TYPE } from "@/constants/record"
import { RecordBoxDialogContent, RecordDisplayActions, RecordDisplayAttentionButton, RecordDisplayCreateProgressButton, RecordDisplayNextButton } from "./record-display.client"
import { RecordDetailSchema } from "@/schemas/record"
import { DetailPageLayout } from "@/components/server/layout"
import { unwrapQueryResult } from "@/helpers/result"
import { InlineError } from "@/components/app/inline-error"
import emptyCover from "@/assets/empty.jpg"

export async function RecordBox({ project, type }: {project: ProjectDetailSchema | AnimeDetailSchema, type: ProjectType}) {
    const result = await retrieveRecordPreview(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} compact/>
    }
    if(!data) {
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Text color="fg.muted" fontSize="sm">{type === ProjectType.ANIME ? "未订阅此动画" : "未添加任何记录"}</Text>
                    <Dialog.Root motionPreset="slide-in-bottom" size="md">
                        <Dialog.Trigger asChild>
                            <Button variant="solid" colorPalette="blue" size="sm" mt="2"><RiBookmark3Line/>{type === ProjectType.ANIME ? "加入订阅" : "添加记录"}</Button>
                        </Dialog.Trigger>
                        <Portal>
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                                <RecordBoxDialogContent type={type} projectId={project.id} />
                            </Dialog.Positioner>
                        </Portal>
                    </Dialog.Root>
                </Box>
            </Box>
        )
    }else if(type === ProjectType.ANIME) {
        const anime = project as AnimeDetailSchema
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
                <NextLink href={`/${type.toLowerCase()}/record/${project.id}`}>
                    {data.specialAttention ? <Text color="blue.fg"><Icon><RiPushpin2Fill/></Icon> 已订阅</Text> : <Text color="blue.fg"><Icon><RiBookmark3Line/></Icon> 已添加记录</Text>}
                    <Flex mt="2">
                        <Stat.Root>
                            <Stat.Label>进度</Stat.Label>
                            <HStack>
                                <Stat.ValueText>{data.episodeWatchedNum ?? 0} / {anime.episodeTotalNum}</Stat.ValueText>
                                <Badge>{Math.floor((data.episodeWatchedNum ?? 0) / anime.episodeTotalNum * 100)}%</Badge>
                            </HStack>
                        </Stat.Root>
                        <Stat.Root>
                            <Stat.Label>上一集在</Stat.Label>
                            <Stat.HelpText>{data.latestWatchedTime ? data.latestWatchedTime.toLocaleDateString() : "(未知)"}</Stat.HelpText>
                        </Stat.Root>
                    </Flex>
                </NextLink>
            </Box>
        )
    }else{
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
                <NextLink href={`/${type.toLowerCase()}/record/${project.id}`}>
                    <Text color="blue.fg"><Icon><RiBookmark3Line/></Icon> 已添加记录</Text>
                    <Flex mt="2">
                        <Stat.Root>
                            <Stat.Label>状态</Stat.Label>
                            <HStack>
                                <Stat.ValueText>{VALUE_TO_RECORD_STATUS[data.status].label}</Stat.ValueText>
                            </HStack>
                        </Stat.Root>
                        {data.status === RecordStatus.WATCHING ? <Stat.Root>
                            <Stat.Label>已持续</Stat.Label>
                            <Stat.HelpText>{data.startTime ? `${Math.floor((new Date().getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60 * 24))}天` : "(未知)"}</Stat.HelpText>
                        </Stat.Root> : undefined}
                        {data.status === RecordStatus.COMPLETED ? <Stat.Root>
                            <Stat.Label>完成于</Stat.Label>
                            <Stat.HelpText>{data.endTime ? data.endTime.toLocaleDateString() : "(未知)"}</Stat.HelpText>
                        </Stat.Root> : undefined}
                    </Flex>
                </NextLink>
            </Box>
        )
    }

}

export function RecordDisplay({ type, project, record }: {type: ProjectType, project: ProjectDetailSchema, record: RecordDetailSchema}) {
    const breadcrumb = {
        url: `/${type.toLowerCase()}/record/${project.id}`,
        detail: project.title
    }

    return <DetailPageLayout breadcrumb={breadcrumb} 
        header={<Header id={project.id} title={project.title} type={type}/>} 
        side={<Side project={project} type={type}/>} 
        content={<Content record={record} type={type} project={project}/>}
    />
}

function Header({ id, title, type }: {id: string, title: string, type: ProjectType}) {
    return (
        <>
            <Button variant="outline" float="right" width={{base: "40px", sm: "auto"}} asChild>
                <NextLink href={`/${type.toLowerCase()}/record/${id}/edit`}>
                    <RiEdit2Line/>
                    <Text display={{base: "none", sm: "inline"}}>编辑</Text>
                </NextLink>
            </Button>
            {title}
        </>
    )
}

function Side({ project, type }: {project: ProjectDetailSchema, type: ProjectType}) {
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
            <Button variant="outline" width="100%" asChild><NextLink href={`/${type.toLowerCase()}/database/${project.id}`}><RiDatabase2Fill/><Text>前往数据库页</Text></NextLink></Button>
        </>
    )
}

function Content({ record, type, project }: {record: RecordDetailSchema, type: ProjectType, project: ProjectDetailSchema}) {
    const anime = type === ProjectType.ANIME ? project as AnimeDetailSchema : null
    const latestProgress = record.progresses.length > 0 ? record.progresses[record.progresses.length - 1] : null
    
    return (
        <>
            <Flex direction="column" gap="2">
                <Flex gap="2" alignItems="center" justifyContent="space-between">
                    <Badge colorPalette={VALUE_TO_RECORD_STATUS[record.status].color} fontSize="sm" px="2" py="1">
                        {VALUE_TO_RECORD_STATUS[record.status].label}
                    </Badge>
                    <Box flex="1 1 auto"/>
                    {record.status === RecordStatus.COMPLETED && <RecordDisplayCreateProgressButton size="sm" projectId={project.id} />}
                    <RecordDisplayAttentionButton projectId={project.id} specialAttention={record.specialAttention}/>
                </Flex>

                {latestProgress && (
                    <Box borderWidth="1px" rounded="md" p="4" bg="bg.subtle">
                        <Flex direction="column" gap="4">
                            <Flex alignItems="center" gap="4">
                                <Box borderWidth="1px" rounded="md" px="3" py="1" bg="bg.default">
                                    <Text fontSize="sm" fontWeight="medium">{latestProgress.ordinal > 1 ? `${latestProgress.ordinal}周目` : "首次订阅"}</Text>
                                </Box>
                                {anime && latestProgress.episodeWatchedNum !== null && (
                                    <Flex alignItems="center" gap="2" flex="1">
                                        <Text fontSize="sm" color="fg.muted">
                                            {Math.floor((latestProgress.episodeWatchedNum / anime.episodeTotalNum) * 100)}%
                                        </Text>
                                        <DualProgressBar
                                            watched={latestProgress.episodeWatchedNum}
                                            published={anime.episodePublishedNum}
                                            total={anime.episodeTotalNum}
                                        />
                                    </Flex>
                                )}
                            </Flex>

                            {anime && <Flex alignItems="center" justifyContent="space-between" fontSize="sm" color="fg.muted" px="1">
                                <Text>
                                    已看完 <Badge px="2" py="1">{latestProgress.episodeWatchedNum}</Badge> 话
                                </Text>
                                <Text>
                                    共&nbsp;
                                    {anime.episodePublishedNum < anime.episodeTotalNum && <><Badge colorPalette="green" px="2" py="1">{anime.episodePublishedNum}</Badge> / </>}
                                    <Badge colorPalette="gray" px="2" py="1">{anime.episodeTotalNum}</Badge>&nbsp;话
                                </Text>
                            </Flex>}
                            
                            <Flex alignItems="flex-end" justifyContent="space-between" pl="1">
                                <Flex direction="column" gap="2" fontSize="sm" color="fg.muted">
                                    {latestProgress.startTime && (
                                        <Flex alignItems="center" gap="2">
                                            <Icon><RiBookmark3Line/></Icon>
                                            <Text>订阅时间 {latestProgress.startTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"})}</Text>
                                        </Flex>
                                    )}
                                    <Flex alignItems="center" gap="2">
                                        <Icon><RiBookmark3Line/></Icon>
                                        <Text>完成时间 {latestProgress.endTime ? latestProgress.endTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"}) : "(未完成)"}</Text>
                                    </Flex>
                                </Flex>
                                {anime && latestProgress.episodeWatchedNum! < anime.episodePublishedNum && <RecordDisplayNextButton projectId={project.id} watched={latestProgress.episodeWatchedNum!} />}
                            </Flex>
                        </Flex>
                    </Box>
                )}

                {record.progresses.length > 1 && <>
                    <Heading size="md" py="1.5">历史进度</Heading>
                    <Flex direction="column" gap="3">
                        {record.progresses.slice(0, -1).reverse().map((progress) => {
                            const isComplete = progress.endTime !== null
                            return (
                                <Box key={progress.ordinal} borderWidth="1px" rounded="md" p="3" bg="bg.subtle">
                                    <Flex alignItems="center" gap="4" justifyContent="space-between">
                                        <Box flex="0 0 auto" borderWidth="1px" rounded="md" px="2" py="1" bg="bg.default">
                                            <Text fontSize="sm">{progress.ordinal}周目</Text>
                                        </Box>
                                        {anime && progress.episodeWatchedNum !== null && isComplete && (
                                            <Text width="full" fontSize="sm" fontWeight="medium">{progress.episodeWatchedNum}话完成</Text>
                                        )}
                                        <Flex flex="1 0 auto" alignItems="center" gap="2" fontSize="sm" color="fg.muted">
                                            <Text>{progress.startTime ? progress.startTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"}) : "(未知时间)"}</Text>
                                            {progress.endTime && (
                                                <>
                                                    <Icon><RiArrowRightLine/></Icon>
                                                    <Text>{progress.endTime.toLocaleDateString("zh-CN", {year: "numeric", month: "long", day: "numeric"})}</Text>
                                                </>
                                            )}
                                        </Flex>
                                    </Flex>
                                </Box>
                            )
                        })}
                    </Flex>
                </>}
            </Flex>
        </>
    )
}

function DualProgressBar({ watched, published, total }: { watched: number, published: number, total: number }) {
    const safeTotal = total <= 0 ? 1 : total
    const watchedPercent = Math.max(0, Math.min(100, (watched / safeTotal) * 100))
    const publishedPercent = Math.max(0, Math.min(100, (published / safeTotal) * 100))

    return (
        <Box flex="1" position="relative" h="10px" rounded="full" bg="border" borderWidth="1px" borderColor="border" overflow="hidden">
            <Box position="absolute" left="0" top="0" h="100%" w={`${publishedPercent}%`} transition="width 0.3s ease-in-out" bg="bg" rounded="full"/>
            <Box position="absolute" left="0" top="0" h="100%" w={`${watchedPercent}%`} transition="width 0.3s ease-in-out" bg="green" rounded="full"/>
        </Box>
    )
}