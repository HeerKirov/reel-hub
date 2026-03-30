import { ProjectDisplay } from "@/components/app/project-display"
import { Box, Text } from "@chakra-ui/react"
import { ProjectType } from "@/constants/project"
import { MovieDetailSchema } from "@/schemas/project-movie"
import { retrieveProjectMovie } from "@/services/project-movie"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const data = await retrieveProjectMovie(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function MovieDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.MOVIE} retrieve={retrieveProjectMovie} boxBar={BoxBar}/>
}

function BoxBar({ data }: {data: MovieDetailSchema}) {
    return <>
        <Box color="blue.fg">
            片长
            <Text fontWeight="700">每集{data.episodeDuration ?? "?"}分钟</Text>
        </Box>
        <Box color={data.episodePublishedNum < data.episodeTotalNum ? "green.fg" : undefined}>
            {data.episodePublishedNum >= data.episodeTotalNum ? "已完结" : "上映中"}
            <Text fontWeight="700">{data.episodePublishedNum >= data.episodeTotalNum ? `共${data.episodeTotalNum}集` : `${data.episodePublishedNum}/${data.episodeTotalNum}集`}</Text>
        </Box>
    </>
}

