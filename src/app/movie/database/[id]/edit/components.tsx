"use client"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { MovieDetailSchema } from "@/schemas/project-movie"
import { deleteProjectMovie, updateProjectMovie } from "@/services/project-movie"

export function Wrapper({ data }: { data: MovieDetailSchema }) {
    return <ProjectUpdateEditor data={data} type={ProjectType.MOVIE} update={updateProjectMovie} delete={deleteProjectMovie} />
}

