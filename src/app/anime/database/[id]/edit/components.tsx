"use client"
import React from "react"
import { useRouter } from "next/navigation"
import * as animeService from "@/services/anime"
import { Editor } from "../../components-editor"
import { AnimeDetailSchema } from "@/schemas/anime"

export function AnimationDatabaseEditContent({ data }: {data: AnimeDetailSchema}) {
    const router = useRouter()

    const onDelete = async () => {
        await animeService.remove(data.id)
        router.push("/anime/database")
    }

    return <Editor data={data} onDelete={onDelete}/>
}