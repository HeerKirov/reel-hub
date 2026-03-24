"use client"
import { useRouter } from "next/navigation"
import { AnimeForm } from "@/schemas/anime"
import { createProjectAnime } from "@/services/project-anime"
import { Editor } from "@/components/app/project-editor"
import { handleActionResult } from "@/helpers/action"

export function Wrap() {
    const router = useRouter()

    const onSubmit = async (data: AnimeForm, resources?: Record<string, Blob>) => {
        const result = handleActionResult(
            await createProjectAnime(data),
            { successTitle: "项目已创建" }
        )
        if(!result.ok) return
        const id = result.value
        router.push(`/anime/database/${id}`)
        if(resources !== undefined) {
            const form = new FormData()
            form.append("projectId", id)
            if(resources["cover"]) form.append("cover", resources["cover"])
            if(resources["avatar"]) form.append("avatar", resources["avatar"])
            await fetch("/api/resources", {method: "POST", body: form})
        }
    }

    return <Editor onSubmit={onSubmit}/>
}