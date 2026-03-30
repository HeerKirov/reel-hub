"use client"
import { RiBook2Line } from "react-icons/ri"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { EpisodePublishRecord } from "@/schemas/project"
import { MangaForm } from "@/schemas/project-manga"
import { ProjectType } from "@/constants/project"
import { createProjectManga } from "@/services/project-manga"
import { MangaInfoTab, MangaExtra } from "../[id]/edit/components"

export function Wrapper() {
    const tabs = [
        { label: "漫画信息", icon: <RiBook2Line />, content: MangaInfoTab }
    ]

    const defaultExtra = (): MangaExtra => {
        return {
            episodeTotalNum: 1,
            episodePublishedNum: 0,
            episodePublishPlan: [],
            episodePublishedRecords: [],
        }
    }

    const extraToForm = (extra: MangaExtra): Partial<MangaForm> => {
        return {
            episodeTotalNum: extra.episodeTotalNum,
            episodePublishedNum: extra.episodePublishedNum,
            episodePublishPlan: extra.episodePublishPlan as EpisodePublishRecord[],
            episodePublishedRecords: extra.episodePublishedRecords as EpisodePublishRecord[],
        }
    }

    return <ProjectCreateEditor type={ProjectType.MANGA} create={createProjectManga} defaultExtra={defaultExtra} extraToForm={extraToForm} tabs={tabs} />
}
