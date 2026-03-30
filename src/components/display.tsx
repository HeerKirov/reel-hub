import { memo } from "react"
import NextLink from "next/link"
import { ProjectRelationSchema } from "@/schemas/project"
import { ProjectType, PROJECT_TYPE_NAMES, RELATION_TYPE_NAMES, RelationType } from "@/constants/project"
import { Flex, SimpleGrid, Image, Link, Badge, Box, Text } from "@chakra-ui/react"
import emptyCover from "@/assets/empty.jpg"

export const RelationDisplay = memo(function RelationDisplay({ relations, type }: {relations: Partial<ProjectRelationSchema>, type: ProjectType}) {
    if(Object.keys(relations).length <= 0) {
        return undefined
    }

    return (
        <Box borderTopWidth="1px" mt="4" pb="2">
            <Text my="2">相关{PROJECT_TYPE_NAMES[type]}</Text>
            <SimpleGrid gap="2" columns={{base: 1, sm: 2}}>
                {Object.entries(relations).map(([relationType, relations]) => relations.map(relation => <Flex key={relation.id}>
                    <Image aspectRatio={1} rounded="lg" width="75px" height="75px" src={relation.resources["avatar"] ?? emptyCover.src} alt={relation.id.toString()}/>
                    <Box py="1" pl="2">
                        <Link asChild><NextLink href={`/${type.toLowerCase()}/database/${relation.id}`}>{relation.title}</NextLink></Link>
                        <p><Badge mt="1" color="fg.muted">{RELATION_TYPE_NAMES[relationType as RelationType]}</Badge></p>
                    </Box>
                </Flex>))}
            </SimpleGrid>
        </Box>
    )
})