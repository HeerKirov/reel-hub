"use client"
import { memo, useCallback } from "react"
import { Field, Flex } from "@chakra-ui/react"
import { NumberInput } from "@/components/form"
import { EpisodePublishedRecordEditor, EpisodePublishPlanEditor } from "@/components/editor"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { EpisodePublishRecord } from "@/schemas/project"
import { MangaDetailSchema, MangaForm } from "@/schemas/project-manga"
import { deleteProjectManga, updateProjectManga } from "@/services/project-manga"
import { RiBook2Line } from "react-icons/ri"

export interface MangaExtra {
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecord[]
    episodePublishedRecords: EpisodePublishRecord[]
}

export const MangaInfoTab = memo(function MangaInfoTab({ extra, setExtra }: {extra: MangaExtra, setExtra: (field: keyof MangaExtra, value: MangaExtra[keyof MangaExtra]) => void}) {
    const setEpisodeTotalNum = useCallback((value: number | null) => setExtra("episodeTotalNum", value ?? 0), [setExtra])
    const setEpisodePublishedNum = useCallback((value: number | null) => setExtra("episodePublishedNum", value ?? 0), [setExtra])
    const setEpisodePublishPlan = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishPlan", value), [setExtra])
    const setEpisodePublishedRecords = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishedRecords", value), [setExtra])

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>总集数</Field.Label>
                    <NumberInput width="full" value={extra.episodeTotalNum} onValueChange={setEpisodeTotalNum} min={0}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>已发布集数</Field.Label>
                    <NumberInput width="full" value={extra.episodePublishedNum} onValueChange={setEpisodePublishedNum} min={0}/>
                </Field.Root>
            </Flex>
            <Field.Root>
                <Field.Label>已发布集数</Field.Label>
                <EpisodePublishedRecordEditor value={extra.episodePublishedRecords} onValueChange={setEpisodePublishedRecords}/>
            </Field.Root>
            <Field.Root>
                <Field.Label>连载计划</Field.Label>
                <EpisodePublishPlanEditor episodePublishedNum={extra.episodePublishedNum} episodeTotalNum={extra.episodeTotalNum} value={extra.episodePublishPlan} onValueChange={setEpisodePublishPlan}/>
            </Field.Root>
        </Flex>
    )
})

export function Wrapper({ data }: { data: MangaDetailSchema }) {
    const tabs = [
        {label: "漫画信息", icon: <RiBook2Line/>, content: MangaInfoTab}
    ]

    const dataToExtra = (d: MangaDetailSchema): MangaExtra => {
        return {
            episodeTotalNum: d.episodeTotalNum ?? 1,
            episodePublishedNum: d.episodePublishedNum ?? 0,
            episodePublishPlan: d.episodePublishPlan ?? [],
            episodePublishedRecords: d.episodePublishedRecords ?? [],
        }
    }

    const extraToForm = (extra: MangaExtra): Partial<MangaForm> => {
        return {
            episodeTotalNum: extra.episodeTotalNum,
            episodePublishedNum: extra.episodePublishedNum,
            episodePublishPlan: extra.episodePublishPlan,
            episodePublishedRecords: extra.episodePublishedRecords,
        }
    }

    return <ProjectUpdateEditor data={data} type={ProjectType.MANGA} update={updateProjectManga} delete={deleteProjectManga} dataToExtra={dataToExtra} extraToForm={extraToForm} tabs={tabs}/>
}

