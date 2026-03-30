import { ProjectDisplay } from "@/components/app/project-display"
import { ProjectType } from "@/constants/project"
import { retrieveProjectMovie } from "@/services/project-movie"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const data = await retrieveProjectMovie(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function MovieDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.MOVIE} retrieve={retrieveProjectMovie} />
}

