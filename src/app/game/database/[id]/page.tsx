import { Fragment } from "react/jsx-runtime"
import { Text, Box, HStack, Tag } from "@chakra-ui/react"
import { ProjectDisplay } from "@/components/app/project-display"
import { GameDetailSchema } from "@/schemas/project-game"
import { ProjectType } from "@/constants/project"
import { Platform, VALUE_TO_ONLINE_TYPE, VALUE_TO_PLATFORM } from "@/constants/game"
import { retrieveProjectGame } from "@/services/project-game"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await retrieveProjectGame(id)
    if(!data) {
        return {
            title: "404 Not Found"
        }
    }
    return {
        title: data.title || "(未命名)"
    }
}

export default async function GameDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProjectDisplay id={id} type={ProjectType.GAME} retrieve={retrieveProjectGame} boxBar={BoxBar} />
}

function BoxBar({ data }: { data: GameDetailSchema }) {
    return <>
        <Box>
            <Text fontWeight="700" color="green.fg">平台</Text>
            <HStack flexWrap="wrap" gap="1" justifyContent="center">
                {data.platform.length > 0
                    ? data.platform.map((p, i) => {
                        const meta = VALUE_TO_PLATFORM[p as Platform]
                        return <Fragment key={p}>
                            {i > 0 ? <Text color="fg.muted"> / </Text> : undefined}
                            <Text color={meta?.color ?? "gray"} fontWeight="700">{meta?.label ?? p}</Text>
                        </Fragment>
                    })
                    : <Text color="fg.muted">(未知)</Text>}
            </HStack>
        </Box>
        <Box color={data.onlineType !== null ? `${VALUE_TO_ONLINE_TYPE[data.onlineType].color}.fg` : undefined}>
            <Text>联机类型</Text>
            <Text fontWeight="700">{data.onlineType !== null ? VALUE_TO_ONLINE_TYPE[data.onlineType].label : "(未知)"}</Text>
        </Box>
    </>
}
