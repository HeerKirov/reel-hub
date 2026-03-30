import { Text, Box } from "@chakra-ui/react"
import { ProjectDisplay } from "@/components/app/project-display"
import { AnimeDetailSchema } from "@/schemas/project-anime"
import { ProjectType } from "@/constants/project"
import { VALUE_TO_BOARDCAST_TYPE, VALUE_TO_ORIGINAL_TYPE } from "@/constants/anime"
import { retrieveProjectAnime } from "@/services/project-anime"

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

export default async function AnimationDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.ANIME} retrieve={retrieveProjectAnime} boxBar={BoxBar}/>
}

function BoxBar({ data }: {data: AnimeDetailSchema}) {
    return <>
        <Box color={data.boardcastType !== null ? `${VALUE_TO_BOARDCAST_TYPE[data.boardcastType].color}.fg` : undefined}>
            {data.boardcastType !== null ? VALUE_TO_BOARDCAST_TYPE[data.boardcastType].label : "(未知放送类型)"}
            <Text fontWeight="700">每集{data.episodeDuration ?? "?"}分钟</Text>
        </Box>
        <Box >
            {data.episodePublishedNum >= data.episodeTotalNum ? "已完结" : "放送中"}
            <Text fontWeight="700">{data.episodePublishedNum >= data.episodeTotalNum ? `共${data.episodeTotalNum}话` : `${data.episodePublishedNum}/${data.episodeTotalNum}话`}</Text>
        </Box>
        <Box color={data.originalType !== null ? `${VALUE_TO_ORIGINAL_TYPE[data.originalType].color}.fg` : undefined}>
            <Text>改编类型</Text>
            <Text fontWeight="700">{data.originalType !== null ? VALUE_TO_ORIGINAL_TYPE[data.originalType].label : "(未知改编类型)"}</Text>
        </Box>
    </>
}
