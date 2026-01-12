import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { retrieveRecord } from "@/services/record"
import { RecordEditor } from "@/components/app/record-editor"
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

export default async function AnimationRecordEdit({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params

    const project = await retrieveProjectAnime(id)
    if(!project) {
        notFound()
    }

    const data = await retrieveRecord(project.id)
    if(!data) {
        notFound()  
    }

    return <RecordEditor type={ProjectType.ANIME} project={project} record={data}/>
}

