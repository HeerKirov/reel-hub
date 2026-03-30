import { retrieveProjectNovel } from "@/services/project-novel"
import { retrieveRecord } from "@/services/record"
import { RecordEditor } from "@/components/app/record-editor"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { ProjectType } from "@/constants/project"
import { unwrapQueryResult } from "@/helpers/result"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const project = await retrieveProjectNovel(id)
    if(!project) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: project.title || "(未命名)"
    }
}

export default async function NovelRecordEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const project = await retrieveProjectNovel(id)
    if(!project) {
        return <NotFoundScreen />
    }

    const result = await retrieveRecord(project.id)
    const { data, error } = unwrapQueryResult(result)
    if(error) {
        return <InlineError error={error} />
    }
    if(!data) {
        return <NotFoundScreen message="尚未创建此项目的阅读记录" />
    }

    return <RecordEditor type={ProjectType.NOVEL} project={project} record={data} />
}

