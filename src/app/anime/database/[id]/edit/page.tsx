import React from "react"
import { retrieveProjectAnime } from "@/services/anime"
import { AnimationDatabaseEditContent } from "./components"

export default async function AnimationDatabaseEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const data = await retrieveProjectAnime(id)
    if(!data) {
        throw new Error("404 Not Found")
    }

    return <AnimationDatabaseEditContent data={data}/>
}
