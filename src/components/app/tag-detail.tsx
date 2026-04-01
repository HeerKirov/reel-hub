"use client"
import NextLink from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RiDeleteBinLine, RiPriceTag3Line } from "react-icons/ri"
import { Box, Button, Container, Flex, Icon, IconButton, Image, Popover, Portal, SimpleGrid, Text } from "@chakra-ui/react"
import { EditableText } from "@/components/form"
import { ProjectType } from "@/constants/project"
import { ProjectListSchema } from "@/schemas/project"
import { TagSchema } from "@/schemas/tag"
import { deleteTag, updateTag } from "@/services/tag"
import { handleActionResult } from "@/helpers/action"
import { resAvatar } from "@/helpers/ui"

export function TagDetail({ data, related, isAdmin, type }: { data: TagSchema, related: ProjectListSchema[], isAdmin: boolean, type: ProjectType }) {
    const router = useRouter()
    const [tag, setTag] = useState(data)
    const [isPending, startTransition] = useTransition()

    const updateName = (name: string) => {
        startTransition(async () => {
            const result = await updateTag(tag.id, { name })
            const handled = handleActionResult(result)
            if(handled.ok) setTag(v => ({ ...v, name }))
        })
    }

    const updateDescription = (description: string) => {
        startTransition(async () => {
            const result = await updateTag(tag.id, { description })
            const handled = handleActionResult(result)
            if(handled.ok) setTag(v => ({ ...v, description }))
        })
    }

    const onDelete = () => {
        startTransition(async () => {
            const result = await deleteTag(tag.id)
            const handled = handleActionResult(result)
            if(handled.ok) router.back()
        })
    }

    return (
        <Container maxW="container.xl" py="4">
            <Flex direction="column" align="center" textAlign="center" py="8">
                <Icon fontSize="7xl" color="fg.muted"><RiPriceTag3Line /></Icon>
                <EditableText mt="3" mb="1" width="sm" justifyContent="center" value={tag.name} placeholder="标签名" onValueChange={updateName} disabled={isPending || !isAdmin} previewProps={{ fontSize: "2xl", fontWeight: "700" }}/>
                <EditableText width="sm" justifyContent="center" value={tag.description} placeholder="描述" onValueChange={updateDescription} disabled={isPending || !isAdmin}/>
                {isAdmin && <Popover.Root>
                    <Popover.Trigger asChild>
                        <IconButton mt="4" alignSelf="flex-end" colorPalette="red" variant="outline" size="sm"><RiDeleteBinLine /></IconButton>
                    </Popover.Trigger>
                    <Portal>
                        <Popover.Positioner>
                            <Popover.Content width="200px">
                                <Popover.Arrow />
                                <Popover.Body>
                                    <Text>确认要删除吗？这会将该标签从所有关联项目中移除。</Text>
                                </Popover.Body>
                                <Popover.Footer>
                                    <Button width="full" colorPalette="red" variant="outline" size="sm" onClick={onDelete}><RiDeleteBinLine /> 删除</Button>
                                </Popover.Footer>
                            </Popover.Content>
                        </Popover.Positioner>
                    </Portal>
                </Popover.Root>}
            </Flex>

            <Box mt="2">
                <Flex justify="space-between" align="center" mb="3">
                    <Text fontSize="xl" fontWeight="700">{type === ProjectType.GAME ? "相关游戏" : "相关动画"}</Text>
                    <Button size="sm" variant="ghost" asChild>
                        <NextLink href={`/${type.toLowerCase()}/database?tag=${encodeURIComponent(tag.name)}`}>查看更多</NextLink>
                    </Button>
                </Flex>
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                    {related.map(item => (
                        <Flex key={item.id} gap="3" asChild>
                            <NextLink href={`/${type.toLowerCase()}/database/${item.id}`}>
                                <Image src={resAvatar(item.resources)} alt={item.title || "(未命名)"} width="60px" height="60px" objectFit="cover" rounded="md" />
                                <Text color="blue.fg">{item.title || "(未命名)"}</Text>
                            </NextLink>
                        </Flex>
                    ))}
                </SimpleGrid>
                {related.length === 0 && <Text color="fg.muted">{type === ProjectType.GAME ? "暂无关联游戏" : "暂无关联动画"}</Text>}
            </Box>
        </Container>
    )
}
