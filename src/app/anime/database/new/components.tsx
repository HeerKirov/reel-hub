"use client"
import { RiTvLine } from "react-icons/ri"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { AnimeForm } from "@/schemas/project-anime"
import { ProjectType } from "@/constants/project"
import { createProjectAnime } from "@/services/project-anime"
import { AnimeExtra, AnimeInfoTab } from "../[id]/edit/components"

export function Wrapper() {
    const tabs = [
        {label: "动画信息", icon: <RiTvLine/>, content: AnimeInfoTab}
    ]

    const defaultExtra = (): AnimeExtra => {
        return {
            originalType: null,
            boardcastType: null,
            episodeDuration: 24,
            episodeTotalNum: 1,
            episodePublishedNum: 0,
            episodePublishPlan: [],
            episodePublishedRecords: [],
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

    return <ProjectCreateEditor type={ProjectType.ANIME} create={createProjectAnime} defaultExtra={defaultExtra} extraToForm={extraToForm} tabs={tabs}/>
}