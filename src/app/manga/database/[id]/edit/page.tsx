import { retrieveProjectManga } from "@/services/project-manga"
import { NotFoundScreen } from "@/components/app/inline-error"
import { Wrapper } from "./components"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await retrieveProjectManga(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function MangaDatabaseEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await retrieveProjectManga(id)
    if(!data) {
        return <NotFoundScreen />
    }
    return <Wrapper data={data} />
}

