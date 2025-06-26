import React from "react"
import { notFound } from "next/navigation"
import { retrieveProjectAnime } from "@/services/anime"
import { AnimationDatabaseEditContent } from "./components"

export default async function AnimationDatabaseEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const data = await retrieveProjectAnime(id)
    if(!data) {
        notFound()
    }

    return <AnimationDatabaseEditContent data={data}/>
}
