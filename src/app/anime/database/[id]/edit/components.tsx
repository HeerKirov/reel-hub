"use client"
import { memo, useCallback } from "react"
import { Field, Flex } from "@chakra-ui/react"
import { Select, NumberInput } from "@/components/form"
import { EpisodePublishedRecordEditor, EpisodePublishPlanEditor } from "@/components/editor"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { EpisodePublishRecord } from "@/schemas/project"
import { AnimeDetailSchema, AnimeForm } from "@/schemas/project-anime"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS } from "@/constants/anime"
import { BoardcastType, OriginalType } from "@/constants/anime"
import { ProjectType } from "@/constants/project"
import { deleteProjectAnime, updateProjectAnime } from "@/services/project-anime"
import { RiTvLine } from "react-icons/ri"

export interface AnimeExtra {
    originalType: OriginalType | null
    boardcastType: BoardcastType | null
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecord[]
    episodePublishedRecords: EpisodePublishRecord[]
}

export const AnimeInfoTab = memo(function AnimeInfoTab({ extra, setExtra }: {extra: AnimeExtra, setExtra: (field: keyof AnimeExtra, value: AnimeExtra[keyof AnimeExtra]) => void}) {
    const setOriginalType = useCallback((value: OriginalType | null) => setExtra("originalType", value), [setExtra])
    const setBoardcastType = useCallback((value: BoardcastType | null) => setExtra("boardcastType", value), [setExtra])
    const setEpisodeDuration = useCallback((value: number | null) => setExtra("episodeDuration", value), [setExtra])
    const setEpisodeTotalNum = useCallback((value: number | null) => setExtra("episodeTotalNum", value ?? 0), [setExtra])
    const setEpisodePublishedNum = useCallback((value: number | null) => setExtra("episodePublishedNum", value ?? 0), [setExtra])
    const setEpisodePublishPlan = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishPlan", value), [setExtra])
    const setEpisodePublishedRecords = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishedRecords", value), [setExtra])

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        原作类型
                    </Field.Label>
                    <Select value={extra.originalType} onValueChange={setOriginalType} items={ORIGINAL_TYPE_ITEMS} placeholder="原作类型"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        放送类型
                    </Field.Label>
                    <Select value={extra.boardcastType} onValueChange={setBoardcastType} items={BOARDCAST_TYPE_ITEMS} placeholder="放送类型"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        单集时长
                    </Field.Label>
                    <NumberInput width="full" value={extra.episodeDuration} onValueChange={setEpisodeDuration} min={0}/>
                </Field.Root>
            </Flex>
            <Flex gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        总集数
                    </Field.Label>
                    <NumberInput width="full" value={extra.episodeTotalNum} onValueChange={setEpisodeTotalNum} min={0}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        已发布集数
                    </Field.Label>
                    <NumberInput width="full" value={extra.episodePublishedNum} onValueChange={setEpisodePublishedNum} min={0}/>
                </Field.Root>
            </Flex>
            <Field.Root>
                <Field.Label>
                    已发布集数
                </Field.Label>
                <EpisodePublishedRecordEditor value={extra.episodePublishedRecords} onValueChange={setEpisodePublishedRecords}/>
            </Field.Root>
            <Field.Root>
                <Field.Label>
                    放送计划
                </Field.Label>
                <EpisodePublishPlanEditor episodePublishedNum={extra.episodePublishedNum} episodeTotalNum={extra.episodeTotalNum} value={extra.episodePublishPlan} onValueChange={setEpisodePublishPlan}/>
            </Field.Root>
        </Flex>
    )
})

export function Wrapper({ data }: {data: AnimeDetailSchema}) {
    const tabs = [
        {label: "动画信息", icon: <RiTvLine/>, content: AnimeInfoTab}
    ]

    const dataToExtra = (data: AnimeDetailSchema): AnimeExtra => {
        return {
            originalType: data.originalType,
            boardcastType: data.boardcastType,
            episodeDuration: data.episodeDuration,
            episodeTotalNum: data.episodeTotalNum ?? 1,
            episodePublishedNum: data.episodePublishedNum ?? 0,
            episodePublishPlan: data.episodePublishPlan ?? [],
            episodePublishedRecords: data.episodePublishedRecords ?? [],
        }
    }

    const extraToForm = (extra: AnimeExtra): Partial<AnimeForm> => {
        return {
            originalType: extra.originalType,
            boardcastType: extra.boardcastType,
            episodeDuration: extra.episodeDuration,
            episodeTotalNum: extra.episodeTotalNum,
            episodePublishedNum: extra.episodePublishedNum,
            episodePublishPlan: extra.episodePublishPlan,
            episodePublishedRecords: extra.episodePublishedRecords,
        }
    }

    return <ProjectUpdateEditor data={data} type={ProjectType.ANIME} update={updateProjectAnime} delete={deleteProjectAnime} dataToExtra={dataToExtra} extraToForm={extraToForm} tabs={tabs}/>
}