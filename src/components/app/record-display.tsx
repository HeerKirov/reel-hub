import NextLink from "next/link"
import { Box, Text, Icon, Flex, Stat, HStack, Badge, Button, Dialog, Portal } from "@chakra-ui/react"
import { RiBookmark3Line, RiPushpin2Fill } from "react-icons/ri"
import { ProjectType, RecordStatus } from "@/prisma/generated"
import { ProjectDetailSchema } from "@/schemas/project"
import { retrieveRecordPreview } from "@/services/record"
import { AnimeDetailSchema } from "@/schemas/anime"
import { VALUE_TO_RECORD_STATUS } from "@/constants/record"
import { RecordBoxDialogContent } from "./record-display.client"

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
                                <RecordBoxDialogContent type={type} />
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