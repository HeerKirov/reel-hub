import { retrieveProjectAnime } from "@/services/project-anime"
import { retrieveRecord } from "@/services/record"
import { RecordEditor } from "@/components/app/record-editor"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { unwrapQueryResult } from "@/helpers/result"

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
        return <NotFoundScreen/>
    }

    const result = await retrieveRecord(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error}/>
    }
    if(!data) {
        return <NotFoundScreen message="尚未创建此项目的观看记录"/>
    }

    return <RecordEditor type={ProjectType.ANIME} project={project} record={data}/>
}

