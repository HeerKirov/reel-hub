import { retrieveProjectManga } from "@/services/project-manga"
import { retrieveRecord } from "@/services/record"
import { RecordDisplay } from "@/components/app/record-display"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { unwrapQueryResult } from "@/helpers/result"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const project = await retrieveProjectManga(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function MangaRecordDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const project = await retrieveProjectManga(id)
    if(!project) {
        return <NotFoundScreen />
    }

    const result = await retrieveRecord(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} />
    }
    if(!data) {
        return <NotFoundScreen message="尚未创建对此项目的阅读记录" />
    }

    return <RecordDisplay type={ProjectType.MANGA} project={project} record={data} />
}

