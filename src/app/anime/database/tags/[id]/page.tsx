import { Metadata } from "next"
import { notFound } from "next/navigation"
import { TagDetail } from "@/components/app/tag-detail"
import { InlineError } from "@/components/app/inline-error"
import { retrieveTag } from "@/services/tag"
import { listProjectAnime } from "@/services/project-anime"
import { unwrapQueryResult } from "@/helpers/result"
import { NavigationBreadcrumb } from "@/components/server/layout"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const tag = await retrieveTag(Number(id))
    if(!tag) return { title: "404 Not Found" }
    return { title: tag.name }
}

export default async function AnimeDatabaseTagDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const tagId = Number(id)
    if(Number.isNaN(tagId)) notFound()

    const tag = await retrieveTag(tagId)
    if(!tag) notFound()

    const listResult = await listProjectAnime({ page: 1, size: 9, tag: tag.name })
    const { data, error } = unwrapQueryResult(listResult)

    return (
        <>
            <NavigationBreadcrumb url="/anime/database" detail={tag.name} />
            {error
                ? <InlineError error={error} />
                : <TagDetail data={tag} related={data.list} />}
        </>
    )
}
