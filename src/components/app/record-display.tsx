import NextLink from "next/link"
import { Box, Text, Icon, Flex, Stat, HStack, Badge, Button, Dialog, Portal, Heading, Image, Table, Progress } from "@chakra-ui/react"
import { RiBookmark3Line, RiPushpin2Fill, RiDatabase2Fill, RiEdit2Line, RiArrowRightLine } from "react-icons/ri"
import { ProjectType, RecordStatus } from "@/prisma/generated"
import { ProjectDetailSchema } from "@/schemas/project"
import { retrieveRecordPreview } from "@/services/record"
import { AnimeDetailSchema } from "@/schemas/anime"
import { VALUE_TO_RECORD_STATUS, VALUE_TO_FOLLOW_TYPE } from "@/constants/record"
import { RecordBoxDialogContent, RecordDisplayActions } from "./record-display.client"
import { RecordDetailSchema } from "@/schemas/record"
import { DetailPageLayout } from "@/components/server/layout"
import emptyCover from "@/assets/empty.jpg"

export async function RecordBox({ project, type }: {project: ProjectDetailSchema | AnimeDetailSchema, type: ProjectType}) {
    const data = await retrieveRecordPreview(project.id)
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
        url: `/${type.toLowerCase()}/database/${project.id}`,
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
            <Flex mt="2" direction="column" gap="6">
                {/* 状态标签和按钮区域 */}
                <Flex gap="2" flexWrap="wrap" alignItems="center">
                    <Badge colorPalette={VALUE_TO_RECORD_STATUS[record.status].color} fontSize="sm" px="2" py="1">
                        {VALUE_TO_RECORD_STATUS[record.status].label}
                    </Badge>
                    {record.specialAttention && (
                        <Button variant="solid" colorPalette="blue" size="sm">
                            <Icon><RiPushpin2Fill/></Icon>
                            订阅中
                        </Button>
                    )}
                    {/* 可以添加更多按钮，如"未看过原作"等 */}
                </Flex>

                {/* 最新进度信息区域 */}
                {latestProgress && (
                    <Box borderWidth="1px" rounded="md" p="4" bg="bg.subtle">
                        <Flex direction="column" gap="4">
                            {/* 周目和百分比 */}
                            <Flex alignItems="center" gap="4">
                                <Box borderWidth="1px" rounded="md" px="3" py="1" bg="bg.default">
                                    <Text fontSize="sm" fontWeight="medium">{latestProgress.ordinal}周目</Text>
                                </Box>
                                {anime && latestProgress.episodeWatchedNum !== null && (
                                    <Flex alignItems="center" gap="2" flex="1">
                                        <Text fontSize="sm" color="fg.muted">
                                            {Math.floor((latestProgress.episodeWatchedNum / anime.episodeTotalNum) * 100)}%
                                        </Text>
                                        <Progress.Root value={(latestProgress.episodeWatchedNum / anime.episodeTotalNum) * 100} flex="1" size="sm" colorPalette="green">
                                            <Progress.Track>
                                                <Progress.Range/>
                                            </Progress.Track>
                                        </Progress.Root>
                                    </Flex>
                                )}
                            </Flex>

                            {/* NEXT按钮和已看完信息 */}
                            <Flex alignItems="center" gap="4" flexWrap="wrap">
                                {anime && latestProgress.episodeWatchedNum !== null && (
                                    <Text fontSize="sm" color="fg.muted">
                                        已看完 {latestProgress.episodeWatchedNum} 话
                                    </Text>
                                )}
                            </Flex>

                            {/* 时间信息 */}
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
                        </Flex>
                    </Box>
                )}

                {/* 交互按钮区域 */}
                <RecordDisplayActions record={record} type={type} project={anime} />
                
                {/* 历史进度列表 */}
                {record.progresses.length > 1 && (
                    <Box>
                        <Heading size="md" mb="3">进度历史</Heading>
                        <Flex direction="column" gap="3">
                            {record.progresses.slice(0, -1).reverse().map((progress) => {
                                const isComplete = progress.endTime !== null
                                return (
                                    <Box key={progress.ordinal} borderWidth="1px" rounded="md" p="3" bg="bg.subtle">
                                        <Flex alignItems="center" gap="4" flexWrap="wrap">
                                            <Box borderWidth="1px" rounded="md" px="2" py="1" bg="bg.default">
                                                <Text fontSize="sm">{progress.ordinal}周目</Text>
                                            </Box>
                                            {anime && progress.episodeWatchedNum !== null && isComplete && (
                                                <Text fontSize="sm" fontWeight="medium">{progress.episodeWatchedNum}话已完成</Text>
                                            )}
                                            <Flex alignItems="center" gap="2" fontSize="sm" color="fg.muted" flex="1">
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
                    </Box>
                )}
            </Flex>
        </>
    )
}