import NextLink from "next/link"
import { Box, Text, Icon, Flex, Stat, HStack, Badge, Button, Dialog, Portal, Heading, Image, Table } from "@chakra-ui/react"
import { RiBookmark3Line, RiPushpin2Fill, RiDatabase2Fill, RiEdit2Line, RiArrowRightLine, RiBillFill } from "react-icons/ri"
import { FormattedDateTime } from "@/components/datetime"
import { InlineError } from "@/components/app/inline-error"
import { DetailPageLayout } from "@/components/server/layout"
import { ProjectType } from "@/constants/project"
import { RecordStatus } from "@/constants/record"
import { VALUE_TO_RECORD_STATUS } from "@/constants/record"
import { isEpisodeProjectType } from "@/constants/project"
import { ProjectDetailSchema } from "@/schemas/project"
import { AnimeDetailSchema } from "@/schemas/project-anime"
import { MovieDetailSchema } from "@/schemas/project-movie"
import { MangaDetailSchema } from "@/schemas/project-manga"
import { RecordDetailSchema, RecordProgressDetailItem } from "@/schemas/record"
import { retrieveRecordPreview } from "@/services/record"
import { retrievePurchaseSummary } from "@/services/purchase"
import { unwrapQueryResult } from "@/helpers/result"
import { resCover } from "@/helpers/ui"
import { RecordBoxDialogContent, RecordDisplayAttentionButton, RecordDisplayCreateProgressButton, RecordDisplayFinishButton, RecordDisplayNextButton, RecordDisplayPlatformEditor, RecordDisplayResumeButton } from "./record-display.client"

export async function RecordBox({ project, type }: {project: ProjectDetailSchema | AnimeDetailSchema, type: ProjectType}) {
    const result = await retrieveRecordPreview(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} compact/>
    }

    if(!data) {
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" minH="7rem">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Text color="fg.muted" fontSize="sm">{isEpisodeProjectType(type) ? "未订阅此项目" : "未添加任何记录"}</Text>
                    <Dialog.Root motionPreset="slide-in-bottom" size="md">
                        <Dialog.Trigger asChild>
                            <Button variant="solid" colorPalette="blue" size="sm" mt="2"><RiBookmark3Line/>{isEpisodeProjectType(type) ? "加入订阅" : "添加记录"}</Button>
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
    }else if(isEpisodeProjectType(type)) {
        const episodeProject = project as AnimeDetailSchema | MovieDetailSchema | MangaDetailSchema
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
                <NextLink href={`/${type.toLowerCase()}/record/${project.id}`}>
                    {data.specialAttention ? <Text color="yellow.fg"><Icon><RiPushpin2Fill/></Icon> {type === ProjectType.ANIME ? "已订阅" : "特别关注"}</Text> : <Text color="blue.fg"><Icon><RiBookmark3Line/></Icon> 记录</Text>}
                    <Flex mt="2">
                        <Stat.Root>
                            <Stat.Label>进度</Stat.Label>
                            <HStack>
                                <Stat.ValueText>{data.episodeWatchedNum ?? 0} / {episodeProject.episodeTotalNum}</Stat.ValueText>
                                <Badge>{Math.floor((data.episodeWatchedNum ?? 0) / episodeProject.episodeTotalNum * 100)}%</Badge>
                            </HStack>
                        </Stat.Root>
                        <Stat.Root>
                            <Stat.Label>上一集在</Stat.Label>
                            <Stat.HelpText><FormattedDateTime value={data.latestWatchedTime} variant="dateOnly" emptyLabel="(未知)"/></Stat.HelpText>
                        </Stat.Root>
                    </Flex>
                </NextLink>
            </Box>
        )
    }else if(type === ProjectType.GAME) {
        return (
            <Flex flex="1 1 100%" gap="2">
                <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
                    <NextLink href={`/${type.toLowerCase()}/record/${project.id}`}>
                        {data.specialAttention ? <Text color="yellow.fg"><Icon><RiPushpin2Fill/></Icon> 特别关注</Text> : <Text color="blue.fg"><Icon><RiBookmark3Line/></Icon> 记录</Text>}
                        {data.status === RecordStatus.WATCHING ? <Stat.Root mt="2">
                            <Stat.Label>已游玩</Stat.Label>
                            <Stat.ValueText>{data.startTime ? `${Math.floor((new Date().getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60 * 24))}天` : "(未知)"}</Stat.ValueText>
                        </Stat.Root> : data.status === RecordStatus.COMPLETED ? <Stat.Root mt="2">
                            <Stat.Label>结束于</Stat.Label>
                            <Stat.HelpText><FormattedDateTime value={data.endTime} variant="dateOnly" emptyLabel="(未知)"/></Stat.HelpText>
                        </Stat.Root> : <Stat.Root mt="2">
                            <Stat.Label>状态</Stat.Label>
                            <Stat.ValueText>{VALUE_TO_RECORD_STATUS[data.status].label}</Stat.ValueText>
                        </Stat.Root>}
                    </NextLink>
                </Box>
                <PurchaseSubBox projectId={project.id} />
            </Flex>
        )
    }else{
        return (
            <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
                <NextLink href={`/${type.toLowerCase()}/record/${project.id}`}>
                {data.specialAttention ? <Text color="yellow.fg"><Icon><RiPushpin2Fill/></Icon> 特别关注</Text> : <Text color="blue.fg"><Icon><RiBookmark3Line/></Icon> 记录</Text>}
                    <Flex mt="2">
                        <Stat.Root>
                            <Stat.Label>状态</Stat.Label>
                            <Stat.ValueText>{VALUE_TO_RECORD_STATUS[data.status].label}</Stat.ValueText>
                        </Stat.Root>
                        {data.status === RecordStatus.WATCHING ? <Stat.Root>
                            <Stat.Label>已持续</Stat.Label>
                            <Stat.ValueText>{data.startTime ? `${Math.floor((new Date().getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60 * 24))}天` : "(未知)"}</Stat.ValueText>
                        </Stat.Root> : data.status === RecordStatus.COMPLETED ? <Stat.Root>
                            <Stat.Label>结束于</Stat.Label>
                            <Stat.HelpText><FormattedDateTime value={data.endTime} variant="dateOnly" emptyLabel="(未知)"/></Stat.HelpText>
                        </Stat.Root> : undefined}
                    </Flex>
                </NextLink>
            </Box>
        )
    }
}

async function PurchaseSubBox(props: {projectId: string}) {
    const purchaseSummaryResult = await retrievePurchaseSummary(props.projectId)
    const { data, error } = unwrapQueryResult(purchaseSummaryResult)
    if(error) {
        return <InlineError error={error} compact/>
    }

    return (
        <Box flex="1 1 100%" borderWidth="1px" rounded="md" p="3" asChild>
            <NextLink href={`/${ProjectType.GAME.toLowerCase()}/purchase/${props.projectId}`}>
                <Text color="blue.fg"><Icon><RiBillFill/></Icon> 消费</Text>
                <Stat.Root mt="2">
                    <Stat.Label>累计消费</Stat.Label>
                    <Stat.ValueText>{data?.totalCost ?? 0}</Stat.ValueText>
                </Stat.Root>
            </NextLink>
        </Box>
    )
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
                <NextLink href={`/${type.toLowerCase()}/record/${id}/edit`} replace>
                    <RiEdit2Line/>
                    <Text display={{base: "none", sm: "inline"}}>编辑</Text>
                </NextLink>
            </Button>
            <NextLink href={`/${type.toLowerCase()}/database/${id}`}>{title}</NextLink>
        </>
    )
}

function Side({ project, type }: {project: ProjectDetailSchema, type: ProjectType}) {
    return (
        <>
            <Image aspectRatio={5 / 7} width="100%" src={resCover(project.resources)} alt={project.title || "(未命名)"}/>
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
    const episodeProject = isEpisodeProjectType(type) ? project as AnimeDetailSchema | MovieDetailSchema | MangaDetailSchema : null
    const latestProgress = record.progresses.length > 0 ? record.progresses[record.progresses.length - 1] : null
    
    return (
        <Flex direction="column" gap="2">
            <Flex gap="2" alignItems="center" justifyContent="space-between">
                <Badge colorPalette={VALUE_TO_RECORD_STATUS[record.status].color} fontSize="sm" px="2" py="1">
                    {VALUE_TO_RECORD_STATUS[record.status].label}
                </Badge>
                <Box flex="1 1 auto"/>
                {(record.status !== RecordStatus.WATCHING) && <RecordDisplayCreateProgressButton size="sm" projectId={project.id} />}
                <RecordDisplayAttentionButton projectId={project.id} type={type} specialAttention={record.specialAttention}/>
            </Flex>

            {latestProgress && (
                episodeProject 
                    ? <LatestProgressBarOfEpidodeType projectId={project.id} latestProgress={latestProgress} episodeProject={episodeProject} /> 
                : type === ProjectType.GAME 
                    ? <LatestProgressBarOfGame projectId={project.id} latestProgress={latestProgress} /> 
                :
                    <LatestProgressBar projectId={project.id} latestProgress={latestProgress} />
            )}

            {record.progresses.length > 1 && <>
                <Heading size="md" py="1.5">历史进度</Heading>
                <Flex direction="column" gap="3">
                    {record.progresses.slice(0, -1).reverse().map((progress) => (
                        <HistoryProgressBar key={progress.ordinal} progress={progress} episodeProject={episodeProject} />
                    ))}
                </Flex>
            </>}
        </Flex>
    )
}

function LatestProgressBarOfEpidodeType({ projectId, latestProgress, episodeProject }: { projectId: string, latestProgress: RecordProgressDetailItem, episodeProject: AnimeDetailSchema | MovieDetailSchema | MangaDetailSchema }) {
    return (
        <Box borderWidth="1px" rounded="md" p="4" bg="bg.subtle">
            <Flex direction="column" gap="4">
                <Flex alignItems="center" gap="4" wrap={{base: "wrap", md: "nowrap"}}>
                    <Box flex="0 0 auto" borderWidth="1px" rounded="md" px="3" py="1" bg="bg.default">
                        <Text fontSize="sm" fontWeight="medium">{latestProgress.ordinal > 1 ? `${latestProgress.ordinal}周目` : "首次订阅"}</Text>
                    </Box>
                    <Flex alignItems="center" gap="2" flex="1">
                        <Text fontSize="sm" color="fg.muted">
                            {Math.floor((latestProgress.episodeWatchedNum! / episodeProject.episodeTotalNum) * 100)}%
                        </Text>
                        <DualProgressBar watched={latestProgress.episodeWatchedNum!} published={episodeProject.episodePublishedNum} total={episodeProject.episodeTotalNum}/>
                    </Flex>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" fontSize="sm" color="fg.muted" px="1">
                    <Text>
                        已看完 <Badge px="2" py="1">{latestProgress.episodeWatchedNum!}</Badge> 话
                    </Text>
                    <Text>
                        共&nbsp;
                        {episodeProject.episodePublishedNum < episodeProject.episodeTotalNum && <><Badge colorPalette="green" px="2" py="1">{episodeProject.episodePublishedNum}</Badge> / </>}
                        <Badge colorPalette="gray" px="2" py="1">{episodeProject.episodeTotalNum}</Badge>&nbsp;话
                    </Text>
                </Flex>

                <Flex alignItems="flex-end" justifyContent="space-between" pl="1">
                    <Flex direction="column" gap="2" fontSize="sm" color="fg.muted">
                        {latestProgress.startTime && (
                            <Flex alignItems="center" gap="2">
                                <Icon><RiBookmark3Line/></Icon>
                                <Text>订阅时间 </Text>
                                <FormattedDateTime value={latestProgress.startTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" />
                            </Flex>
                        )}
                        <Flex alignItems="center" gap="2">
                            <Icon><RiBookmark3Line/></Icon>
                            <Text>完成时间 </Text>
                            <FormattedDateTime value={latestProgress.endTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" emptyLabel="(未完成)" />
                        </Flex>
                    </Flex>
                    {latestProgress.status === RecordStatus.DROPPED ? (
                        <RecordDisplayResumeButton projectId={projectId} ordinal={latestProgress.ordinal}/>
                    ) : latestProgress.episodeWatchedNum! < episodeProject.episodePublishedNum ? (
                        <RecordDisplayNextButton projectId={projectId} ordinal={latestProgress.ordinal} watched={latestProgress.episodeWatchedNum!} />
                    ) : undefined}
                </Flex>
            </Flex>
        </Box>
    )
}

function LatestProgressBarOfGame({ projectId, latestProgress }: { projectId: string, latestProgress: RecordProgressDetailItem }) {
    const duration = latestProgress.startTime ? Math.floor((new Date().getTime() - new Date(latestProgress.startTime).getTime()) / (1000 * 60 * 60 * 24)) : null
    return (
        <Flex direction={{base: "column", sm: "row"}} gap="4">
            <Box flex="1 0.5 100%" borderWidth="1px" rounded="md" p="4" bg="bg.subtle">
                <Flex direction="column" gap="4">
                    <Flex alignItems="center" gap="4" wrap={{base: "wrap", md: "nowrap"}}>
                        <Box flex="0 0 auto" borderWidth="1px" rounded="md" px="3" py="1" bg="bg.default">
                            <Text fontSize="sm" fontWeight="medium">{latestProgress.ordinal > 1 ? `${latestProgress.ordinal}周目` : "首次订阅"}</Text>
                        </Box>
                        {duration && <Box fontSize="sm" color="fg.muted">
                            已持续
                            <Text as="span" fontWeight="medium" fontSize="lg" color="fg"> {duration} </Text>
                            天
                        </Box>}
                        <Box flex="1 0 auto" display={{base: "none", md: "block"}} />
                        <Box fontSize="sm">
                            <RecordDisplayPlatformEditor projectId={projectId} ordinal={latestProgress.ordinal} platform={latestProgress.platform}/>
                        </Box>
                    </Flex>

                    <Flex alignItems="flex-end" justifyContent="space-between" pl="1">
                        <Flex direction="column" gap="2" fontSize="sm" color="fg.muted">
                            {latestProgress.startTime && (
                                <Flex alignItems="center" gap="2">
                                    <Icon><RiBookmark3Line/></Icon>
                                    <Text>订阅时间 </Text>
                                    <FormattedDateTime value={latestProgress.startTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" />
                                </Flex>
                            )}
                            <Flex alignItems="center" gap="2">
                                <Icon><RiBookmark3Line/></Icon>
                                <Text>完成时间 </Text>
                                <FormattedDateTime value={latestProgress.endTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" emptyLabel="(未完成)" />
                            </Flex>
                        </Flex>
                        {latestProgress.endTime === null ? (
                            <RecordDisplayFinishButton projectId={projectId} ordinal={latestProgress.ordinal}/>
                        ) : latestProgress.status === RecordStatus.DROPPED ? (
                            <RecordDisplayResumeButton projectId={projectId} ordinal={latestProgress.ordinal}/>
                        ) : undefined}
                    </Flex>
                </Flex>
            </Box>
            <PurchaseSubBox projectId={projectId} />
        </Flex>
    )
}

function LatestProgressBar({ projectId, latestProgress }: { projectId: string, latestProgress: RecordProgressDetailItem }) {
    return (
        <Box borderWidth="1px" rounded="md" p="4" bg="bg.subtle">
            <Flex direction="column" gap="4">
                <Flex alignItems="center" gap="4" wrap={{base: "wrap", md: "nowrap"}}>
                    <Box flex="0 0 auto" borderWidth="1px" rounded="md" px="3" py="1" bg="bg.default">
                        <Text fontSize="sm" fontWeight="medium">{latestProgress.ordinal > 1 ? `${latestProgress.ordinal}周目` : "首次订阅"}</Text>
                    </Box>
                    {latestProgress.startTime && (
                        <Flex flex="1 0 auto" alignItems="center" gap="2" fontSize="sm" color="fg.muted">
                            <Icon><RiBookmark3Line/></Icon>
                            <Text>订阅时间 </Text>
                            <FormattedDateTime value={latestProgress.startTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" />
                        </Flex>
                    )}
                    <Flex flex="1 0 auto" order={{base: 1, md: 0}} alignItems="center" gap="2" fontSize="sm" color="fg.muted">
                        <Icon><RiBookmark3Line/></Icon>
                        <Text>完成时间 </Text>
                        <FormattedDateTime value={latestProgress.endTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" emptyLabel="(未完成)" />
                    </Flex>
                    <Box display={{base: "none", md: "block"}} w="full"/>
                    {latestProgress.endTime === null ? <Box order={{base: 0, md: 1}}>  
                        <RecordDisplayFinishButton projectId={projectId} ordinal={latestProgress.ordinal}/>
                    </Box> : latestProgress.status === RecordStatus.DROPPED ? (<Box order={{base: 0, md: 1}}>  
                        <RecordDisplayResumeButton projectId={projectId} ordinal={latestProgress.ordinal}/>
                    </Box>) : undefined}
                </Flex>
            </Flex>
        </Box>
    )
}

function HistoryProgressBar({ progress, episodeProject }: { progress: RecordProgressDetailItem, episodeProject: AnimeDetailSchema | MovieDetailSchema | MangaDetailSchema | null }) {
    const isComplete = progress.endTime !== null
    return (
        <Box borderWidth="1px" rounded="md" p="3" bg="bg.subtle">
            <Flex alignItems="center" gap="4" justifyContent="space-between">
                <Box flex="0 0 auto" borderWidth="1px" rounded="md" px="2" py="1" bg="bg.default">
                    <Text fontSize="sm">{progress.ordinal}周目</Text>
                </Box>
                {progress.status === RecordStatus.DROPPED && <Badge px="2" py="2">已放弃</Badge>}
                {episodeProject && progress.episodeWatchedNum !== null && isComplete && (
                    <Text width="full" fontSize="sm" fontWeight="medium">{progress.episodeWatchedNum}话完成</Text>
                )}
                <Flex flex="1 0 auto" alignItems="center" gap="2" fontSize="sm" color="fg.muted">
                    <FormattedDateTime value={progress.startTime} variant="dateOnly" fontSize="sm" color="fg.muted" emptyLabel="(未知时间)" />
                    {progress.endTime && (
                        <>
                            <Icon><RiArrowRightLine/></Icon>
                            <FormattedDateTime value={progress.endTime} variant="dateOnly" fontSize="sm" color="fg.muted" display="inline" />
                        </>
                    )}
                </Flex>
            </Flex>
        </Box>
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