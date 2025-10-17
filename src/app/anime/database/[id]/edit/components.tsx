"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { updateProjectAnime, deleteProjectAnime } from "@/services/anime"
import { AnimeDetailSchema, AnimeForm } from "@/schemas/anime"
import { Editor } from "@/components/app/project-editor"

export function AnimationDatabaseEditContent({ data }: {data: AnimeDetailSchema}) {
    const router = useRouter()

    const onSubmit = async (form: AnimeForm, resources?: Record<string, Blob>) => {
        await updateProjectAnime(data.id, form)
        if(resources !== undefined) {
            const form = new FormData()
            form.append("projectId", data.id)
            if(resources["cover"]) form.append("cover", resources["cover"])
            if(resources["avatar"]) form.append("avatar", resources["avatar"])
            await fetch("/api/resources", {method: "POST", body: form})
        }
        router.push(`/anime/database/${data.id}`)
    }

    const onDelete = async () => {
        await deleteProjectAnime(data.id)
        router.push("/anime/database")
    }

    return <Editor data={data} onSubmit={onSubmit} onDelete={onDelete}/>
}