"use client"
import { useRouter } from "next/navigation"
import { updateProjectAnime, deleteProjectAnime } from "@/services/project-anime"
import { AnimeDetailSchema, AnimeForm } from "@/schemas/anime"
import { Editor } from "@/components/app/project-editor"
import { handleActionResult } from "@/helpers/action"

export function AnimationDatabaseEditContent({ data }: {data: AnimeDetailSchema}) {
    const router = useRouter()

    const onSubmit = async (form: AnimeForm, resources?: Record<string, Blob>) => {
        const result = handleActionResult(
            await updateProjectAnime(data.id, form),
            { successTitle: "项目已更新" }
        )
        if(!result.ok) return
        if(resources !== undefined) {
            const form = new FormData()
            form.append("projectId", data.id)
            if(resources["cover"]) form.append("cover", resources["cover"])
            if(resources["avatar"]) form.append("avatar", resources["avatar"])
            await fetch("/api/resources", {method: "POST", body: form})
        }
        router.replace(`/anime/database/${data.id}`)
    }

    const onDelete = async () => {
        const result = handleActionResult(
            await deleteProjectAnime(data.id),
            { successTitle: "项目已删除" }
        )
        if(!result.ok) return
        router.replace("/anime/database")
    }

    const onCancel = () => {
        router.replace(`/anime/database/${data.id}`)
    }

    return <Editor data={data} onSubmit={onSubmit} onDelete={onDelete} onCancel={onCancel}/>
}