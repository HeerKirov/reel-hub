"use client"
import { RiMovieLine } from "react-icons/ri"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { EpisodePublishRecord } from "@/schemas/project"
import { MovieForm } from "@/schemas/project-movie"
import { ProjectType } from "@/constants/project"
import { createProjectMovie } from "@/services/project-movie"
import { MovieInfoTab, MovieExtra } from "../[id]/edit/components"

export function Wrapper() {
    const tabs = [
        { label: "电影信息", icon: <RiMovieLine />, content: MovieInfoTab }
    ]

    const defaultExtra = (): MovieExtra => {
        return {
            episodeDuration: 120,
            episodeTotalNum: 1,
            episodePublishedNum: 0,
            episodePublishPlan: [],
            episodePublishedRecords: [],
        }
    }

    const extraToForm = (extra: MovieExtra): Partial<MovieForm> => {
        return {
            episodeDuration: extra.episodeDuration,
            episodeTotalNum: extra.episodeTotalNum,
            episodePublishedNum: extra.episodePublishedNum,
            episodePublishPlan: extra.episodePublishPlan as EpisodePublishRecord[],
            episodePublishedRecords: extra.episodePublishedRecords as EpisodePublishRecord[],
        }
    }

    return <ProjectCreateEditor type={ProjectType.MOVIE} create={createProjectMovie} defaultExtra={defaultExtra} extraToForm={extraToForm} tabs={tabs} />
}
