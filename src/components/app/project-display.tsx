import { memo } from "react"
import NextLink from "next/link"
import { ProjectRelationType } from "@/schemas/project"
import { Flex, SimpleGrid, Image, Link, Badge, Box, Text } from "@chakra-ui/react"

export const RelationDisplay = memo(function RelationDisplay({ relations }: {relations: ProjectRelationType}) {
    if(Object.keys(relations).length <= 0) {
        return undefined
    }

    return (
        <Box borderTopWidth="1px" mt="4" pb="2">
            <Text my="2">相关动画</Text>
            <SimpleGrid gap="2" columns={{base: 1, sm: 2, md: 3, lg: 4}}>
                {Object.entries(relations).map(([relationType, relations]) => relations.map(relation => <Flex key={relation.id}>
                    <Image aspectRatio={1} rounded="lg" width="75px" height="75px" src={relation.resources["avatar"]} alt={relation.id.toString()}/>
                    <Box py="1" pl="2">
                        <Link asChild><NextLink href={`/anime/database/${relation.id}`}>{relation.title}</NextLink></Link>
                        <p><Badge mt="1" color="fg.muted">{relationType}</Badge></p>
                    </Box>
                </Flex>))}
            </SimpleGrid>
        </Box>
    )
})