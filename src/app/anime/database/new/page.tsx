import { Metadata } from "next"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { createProjectAnime } from "@/services/project-anime"

export const metadata: Metadata = {
    title: "新建"
}

export default function AnimationNew() {
    return <ProjectCreateEditor type={ProjectType.ANIME} create={createProjectAnime}/>
}