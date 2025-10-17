"use client"
import { useRouter } from "next/navigation"
import { AnimeForm } from "@/schemas/anime"
import { createProjectAnime } from "@/services/anime"
import { Editor } from "@/components/app/project-editor"

export function Wrap() {
    const router = useRouter()

    const onSubmit = async (data: AnimeForm, resources?: Record<string, Blob>) => {
        const id = await createProjectAnime(data)
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