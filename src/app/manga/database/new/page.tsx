import { Metadata } from "next"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { createProjectManga } from "@/services/project-manga"

export const metadata: Metadata = {
    title: "新建"
}

export default function MangaDatabaseNew() {
    return <ProjectCreateEditor type={ProjectType.MANGA} create={createProjectManga} />
}

