"use client"
import { useRouter } from "next/navigation"
import { AnimeCreateForm } from "@/schemas/anime"
import * as animeService from "@/services/anime"
import { Editor } from "../components-editor"

export default function AnimationNew() {
    const router = useRouter()

    const onSubmit = async (data: AnimeCreateForm) => {
        const id = await animeService.create(data)
        router.push(`/anime/database/${id}`)
    }

    return <Editor onSubmit={onSubmit} />
}