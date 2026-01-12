import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { retrieveRecord } from "@/services/record"
import { RecordDisplay } from "@/components/app/record-display"
import { ProjectType } from "@/constants/project"

export async function generateMetadata({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params
    const project = await retrieveProjectAnime(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function AnimationRecordDetail({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params

    const project = await retrieveProjectAnime(id)
    if(!project) {
        notFound()
    }

    const data = await retrieveRecord(project.id)
    if(!data) {
        notFound()  
    }

    return <RecordDisplay type={ProjectType.ANIME} project={project} record={data}/>
}

