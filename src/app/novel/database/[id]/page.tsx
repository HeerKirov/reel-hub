import { ProjectDisplay } from "@/components/app/project-display"
import { ProjectType } from "@/constants/project"
import { retrieveProjectNovel } from "@/services/project-novel"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const data = await retrieveProjectNovel(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function NovelDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.NOVEL} retrieve={retrieveProjectNovel} />
}

