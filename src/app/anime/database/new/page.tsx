"use client"
import { useRouter } from "next/navigation"
import { AnimeForm } from "@/schemas/anime"
import * as animeService from "@/services/anime"
import { Editor } from "../components-editor"

export default function AnimationNew() {
    const router = useRouter()

    const onSubmit = async (data: AnimeForm) => {
        const id = await animeService.create(data)
        router.push(`/anime/database/${id}`)
    }

    return <Editor onSubmit={onSubmit} />
}