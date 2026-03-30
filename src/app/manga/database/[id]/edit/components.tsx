"use client"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { MangaDetailSchema } from "@/schemas/project-manga"
import { deleteProjectManga, updateProjectManga } from "@/services/project-manga"

export function Wrapper({ data }: { data: MangaDetailSchema }) {
    return <ProjectUpdateEditor data={data} type={ProjectType.MANGA} update={updateProjectManga} delete={deleteProjectManga} />
}

