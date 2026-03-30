"use client"
import { memo, useCallback } from "react"
import { RiMovieLine } from "react-icons/ri"
import { Field, Flex } from "@chakra-ui/react"
import { NumberInput } from "@/components/form"
import { EpisodePublishedRecordEditor, EpisodePublishPlanEditor } from "@/components/editor"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { EpisodePublishRecord } from "@/schemas/project"
import { MovieDetailSchema, MovieForm } from "@/schemas/project-movie"
import { deleteProjectMovie, updateProjectMovie } from "@/services/project-movie"

export interface MovieExtra {
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecord[]
    episodePublishedRecords: EpisodePublishRecord[]
}

export const MovieInfoTab = memo(function MovieInfoTab({ extra, setExtra }: {extra: MovieExtra, setExtra: (field: keyof MovieExtra, value: MovieExtra[keyof MovieExtra]) => void}) {
    const setEpisodeDuration = useCallback((value: number | null) => setExtra("episodeDuration", value), [setExtra])
    const setEpisodeTotalNum = useCallback((value: number | null) => setExtra("episodeTotalNum", value ?? 0), [setExtra])
    const setEpisodePublishedNum = useCallback((value: number | null) => setExtra("episodePublishedNum", value ?? 0), [setExtra])
    const setEpisodePublishPlan = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishPlan", value), [setExtra])
    const setEpisodePublishedRecords = useCallback((value: EpisodePublishRecord[]) => setExtra("episodePublishedRecords", value), [setExtra])

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>单集时长</Field.Label>
                    <NumberInput width="full" value={extra.episodeDuration} onValueChange={setEpisodeDuration} min={0}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>总集数</Field.Label>
                    <NumberInput width="full" value={extra.episodeTotalNum} onValueChange={setEpisodeTotalNum} min={0}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>已发布集数</Field.Label>
                    <NumberInput width="full" value={extra.episodePublishedNum} onValueChange={setEpisodePublishedNum} min={0}/>
                </Field.Root>
            </Flex>
            <Field.Root>
                <Field.Label>已发布集数</Field.Label>
                <EpisodePublishedRecordEditor value={extra.episodePublishedRecords} onValueChange={setEpisodePublishedRecords}/>
            </Field.Root>
            <Field.Root>
                <Field.Label>上映计划</Field.Label>
                <EpisodePublishPlanEditor episodePublishedNum={extra.episodePublishedNum} episodeTotalNum={extra.episodeTotalNum} value={extra.episodePublishPlan} onValueChange={setEpisodePublishPlan}/>
            </Field.Root>
        </Flex>
    )
})

export function Wrapper({ data }: { data: MovieDetailSchema }) {
    const tabs = [
        {label: "电影信息", icon: <RiMovieLine/>, content: MovieInfoTab}
    ]

    const dataToExtra = (d: MovieDetailSchema): MovieExtra => {
        return {
            episodeDuration: d.episodeDuration,
            episodeTotalNum: d.episodeTotalNum ?? 1,
            episodePublishedNum: d.episodePublishedNum ?? 0,
            episodePublishPlan: d.episodePublishPlan ?? [],
            episodePublishedRecords: d.episodePublishedRecords ?? [],
        }
    }

    const extraToForm = (extra: MovieExtra): Partial<MovieForm> => {
        return {
            episodeDuration: extra.episodeDuration,
            episodeTotalNum: extra.episodeTotalNum,
            episodePublishedNum: extra.episodePublishedNum,
            episodePublishPlan: extra.episodePublishPlan,
            episodePublishedRecords: extra.episodePublishedRecords,
        }
    }

    return <ProjectUpdateEditor data={data} type={ProjectType.MOVIE} update={updateProjectMovie} delete={deleteProjectMovie} dataToExtra={dataToExtra} extraToForm={extraToForm} tabs={tabs}/>
}

