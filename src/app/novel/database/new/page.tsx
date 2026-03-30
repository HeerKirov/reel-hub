import { Metadata } from "next"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { createProjectNovel } from "@/services/project-novel"

export const metadata: Metadata = {
    title: "新建"
}

export default function NovelDatabaseNew() {
    return <ProjectCreateEditor type={ProjectType.NOVEL} create={createProjectNovel} />
}

