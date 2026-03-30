import { ProjectDisplay } from "@/components/app/project-display"
import { Box, Text } from "@chakra-ui/react"
import { ProjectType } from "@/constants/project"
import { MangaDetailSchema } from "@/schemas/project-manga"
import { retrieveProjectManga } from "@/services/project-manga"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const data = await retrieveProjectManga(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function MangaDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.MANGA} retrieve={retrieveProjectManga} boxBar={BoxBar}/>
}

function BoxBar({ data }: {data: MangaDetailSchema}) {
    return <>
        <Box color="pink.fg">
            连载状态
            <Text fontWeight="700">{data.episodePublishedNum >= data.episodeTotalNum ? "已完结" : "连载中"}</Text>
        </Box>
        <Box color={data.episodePublishedNum < data.episodeTotalNum ? "green.fg" : undefined}>
            进度
            <Text fontWeight="700">{data.episodePublishedNum >= data.episodeTotalNum ? `共${data.episodeTotalNum}话` : `${data.episodePublishedNum}/${data.episodeTotalNum}话`}</Text>
        </Box>
    </>
}

