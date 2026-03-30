"use client"
import { RiTvLine } from "react-icons/ri"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { GameForm } from "@/schemas/project-game"
import { ProjectType } from "@/constants/project"
import { createProjectGame } from "@/services/project-game"
import { GameExtra, GameInfoTab } from "../[id]/edit/components"

export function Wrapper() {
    const tabs = [
        {label: "游戏信息", icon: <RiTvLine/>, content: GameInfoTab}
    ]

    const defaultExtra = (): GameExtra => {
        return {
            platform: [],
            onlineType: null,
        }
    }

    const extraToForm = (extra: GameExtra): Partial<GameForm> => {
        return {
            platform: extra.platform,
            onlineType: extra.onlineType,
        }
    }

    return <ProjectCreateEditor type={ProjectType.GAME} create={createProjectGame} defaultExtra={defaultExtra} extraToForm={extraToForm} tabs={tabs}/>
}