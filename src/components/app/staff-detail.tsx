"use client"
import NextLink from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RiDeleteBinLine, RiUser2Line } from "react-icons/ri"
import { Box, Button, Container, Flex, Icon, IconButton, Image, Popover, Portal, SimpleGrid, Text } from "@chakra-ui/react"
import { EditableText } from "@/components/form"
import { ProjectListSchema } from "@/schemas/project"
import { ProjectType } from "@/constants/project"
import { StaffSchema } from "@/schemas/staff"
import { deleteStaff, updateStaff } from "@/services/staff"
import { handleActionResult } from "@/helpers/action"
import emptyCover from "@/assets/empty.jpg"

export function StaffDetail({ data, related, isAdmin, type }: { data: StaffSchema, related: ProjectListSchema[], isAdmin: boolean, type: ProjectType }) {
    const router = useRouter()
    
    const [staff, setStaff] = useState(data)
    const [isPending, startTransition] = useTransition()
    
    const updateName = (name: string) => {
        startTransition(async () => {
            const result = await updateStaff(staff.id, { name })
            const handled = handleActionResult(result)
            if(handled.ok) setStaff(v => ({ ...v, name }))
        })
    }

    const updateOtherNames = (otherNamesRaw: string) => {
        const otherNames = otherNamesRaw.split(",").map(item => item.trim())
        startTransition(async () => {
            const result = await updateStaff(staff.id, { otherNames })
            const handled = handleActionResult(result)
            if(handled.ok) setStaff(v => ({ ...v, otherNames }))
        })
    }

    const updateDescription = (description: string) => {
        startTransition(async () => {
            const result = await updateStaff(staff.id, { description })
            const handled = handleActionResult(result)
            if(handled.ok) setStaff(v => ({ ...v, description }))
        })
    }

    const onDelete = () => {
        startTransition(async () => {
            const result = await deleteStaff(staff.id)
            const handled = handleActionResult(result)
            if(handled.ok) router.back()
        })
    }

    return (
        <Container maxW="container.xl" py="4">
            <Flex direction="column" align="center" textAlign="center" py="8">
                <Icon fontSize="7xl" color="fg.muted"><RiUser2Line /></Icon>
                <EditableText mt="3" mb="1" width="sm" justifyContent="center" value={staff.name} placeholder="STAFF 名称" onValueChange={updateName} disabled={isPending || !isAdmin} previewProps={{ fontSize: "2xl", fontWeight: "700" }}/>
                <EditableText width="sm" justifyContent="center" value={staff.otherNames.join(", ")} placeholder="别名" onValueChange={updateOtherNames} disabled={isPending || !isAdmin} previewProps={{ fontSize: "sm", color: "fg.muted" }}/>
                <EditableText width="sm" justifyContent="center" value={staff.description} placeholder="描述" onValueChange={updateDescription} disabled={isPending || !isAdmin}/>
                {isAdmin && <Popover.Root>
                    <Popover.Trigger asChild>
                        <IconButton mt="4" alignSelf="flex-end" colorPalette="red" variant="outline" size="sm"><RiDeleteBinLine /></IconButton>
                    </Popover.Trigger>
                    <Portal>
                        <Popover.Positioner>
                            <Popover.Content width="200px">
                                <Popover.Arrow />
                                <Popover.Body>
                                    <Text>确认要删除吗？这会将该STAFF从所有关联的项目中移除。</Text>
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
                        <NextLink href={`/${type.toLowerCase()}/database?staff=${encodeURIComponent(staff.name)}`}>查看更多</NextLink>
                    </Button>
                </Flex>
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                    {related.map(item => (
                        <Flex key={item.id} gap="3" asChild>
                            <NextLink href={`/${type.toLowerCase()}/database/${item.id}`}>
                                <Image src={item.resources.avatar ?? item.resources.cover ?? emptyCover.src} alt={item.title || "(未命名)"} width="60px" height="60px" objectFit="cover" rounded="md" />
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
