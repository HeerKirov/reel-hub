import React from "react"
import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { AnimationDatabaseEditContent } from "./components"

export async function generateMetadata({ params }: {params: Promise<{id: string}>}) {
    const { id } = await params
    const data = await retrieveProjectAnime(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function AnimationDatabaseEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const data = await retrieveProjectAnime(id)
    if(!data) {
        notFound()
    }

    return <AnimationDatabaseEditContent data={data}/>
}
