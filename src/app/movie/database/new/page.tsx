import { Metadata } from "next"
import { ProjectCreateEditor } from "@/components/app/project-editor"
import { ProjectType } from "@/constants/project"
import { createProjectMovie } from "@/services/project-movie"

export const metadata: Metadata = {
    title: "新建"
}

export default function MovieDatabaseNew() {
    return <ProjectCreateEditor type={ProjectType.MOVIE} create={createProjectMovie} />
}

