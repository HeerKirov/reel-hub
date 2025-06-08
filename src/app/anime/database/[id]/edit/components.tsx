"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { updateProjectAnime, deleteProjectAnime } from "@/services/anime"
import { AnimeDetailSchema, AnimeForm } from "@/schemas/anime"
import { Editor } from "../../components-editor"

export function AnimationDatabaseEditContent({ data }: {data: AnimeDetailSchema}) {
    const router = useRouter()

    const onSubmit = async (form: AnimeForm) => {
        await updateProjectAnime(data.id, form)
        router.push(`/anime/database/${data.id}`)
    }

    const onDelete = async () => {
        await deleteProjectAnime(data.id)
        router.push("/anime/database")
    }

    return <Editor data={data} onSubmit={onSubmit} onDelete={onDelete}/>
}