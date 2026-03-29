import { Metadata } from "next"
import { TagDetail } from "@/components/app/tag-detail"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { retrieveTag } from "@/services/tag"
import { listProjectAnime } from "@/services/project-anime"
import { unwrapQueryResult } from "@/helpers/result"
import { hasPermission } from "@/helpers/next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const tag = await retrieveTag(Number(id))
    if(!tag) return { title: "404 Not Found" }
    return { title: tag.name }
}

export default async function AnimeDatabaseTagDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const tagId = Number(id)
    if(Number.isNaN(tagId)) return <NotFoundScreen/>

    const tag = await retrieveTag(tagId)
    if(!tag) return <NotFoundScreen/>

    const listResult = await listProjectAnime({ page: 1, size: 9, tag: tag.name })
    const { data, error } = unwrapQueryResult(listResult)

    if(error) return <InlineError error={error} />

    const isAdmin = await hasPermission("admin")

    return (
        <>
            <NavigationBreadcrumb url="/anime/database" detail={tag.name} />
            <TagDetail data={tag} related={data.list} isAdmin={isAdmin} />
        </>
    )
}
