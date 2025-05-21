import React from "react"
import NextLink from "next/link"
import { RiEdit2Line } from "react-icons/ri"
import { Button, Text } from "@chakra-ui/react"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { Editor } from "./components"

export default async function AnimationDatabaseEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <>
            <NavigationBreadcrumb url="/anime/database" detail="时光流逝，饭菜依旧美味"/>

            <Editor />
        </>
    )
}
