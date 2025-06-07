"use client"
import React from "react"
import { useRouter } from "next/navigation"
import * as animeService from "@/services/anime"
import { AnimeDetailSchema, AnimeForm } from "@/schemas/anime"
import { Editor } from "../../components-editor"

export function AnimationDatabaseEditContent({ data }: {data: AnimeDetailSchema}) {
    const router = useRouter()

    const onSubmit = async (form: AnimeForm) => {
        await animeService.update(data.id, form)
        router.push(`/anime/database/${data.id}`)
    }

    const onDelete = async () => {
        await animeService.remove(data.id)
        router.push("/anime/database")
    }

    return <Editor data={data} onSubmit={onSubmit} onDelete={onDelete}/>
}