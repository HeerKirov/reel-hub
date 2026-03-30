"use client"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { NovelDetailSchema } from "@/schemas/project-novel"
import { deleteProjectNovel, updateProjectNovel } from "@/services/project-novel"

export function Wrapper({ data }: { data: NovelDetailSchema }) {
    return <ProjectUpdateEditor data={data} type={ProjectType.NOVEL} update={updateProjectNovel} delete={deleteProjectNovel} />
}

