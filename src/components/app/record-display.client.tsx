"use client"
import { Box, Button, CloseButton, Dialog, Flex, Icon, Text } from "@chakra-ui/react"
import { RiBookmark3Line, RiEyeCloseFill, RiPenNibFill } from "react-icons/ri"
import { ProjectType } from "@/constants/project"

export function RecordBoxDialogContent({ type }: {type: ProjectType}) {
    return (
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>{type === ProjectType.ANIME ? "加入订阅" : "添加记录"}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
                <Text fontSize="md" textAlign="center">以何种方式添加记录？</Text>
                <Flex my="4" gap="2" textAlign="center">
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiBookmark3Line/></Icon>
                        <Text>{{
                            [ProjectType.ANIME]: "从头开始观看",
                            [ProjectType.GAME]: "第一次游玩",
                            [ProjectType.MANGA]: "从头开始阅读",
                            [ProjectType.MOVIE]: "第一次观看",
                            [ProjectType.NOVEL]: "从头开始阅读",
                        }[type]}</Text>
                        <Button variant="solid" colorPalette="blue" size="sm" mt="2">{type === ProjectType.ANIME ? "订阅" : "新进度"}</Button>
                    </Box>
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiPenNibFill/></Icon>
                        <Text>早就{type === ProjectType.GAME ? "玩" : "看"}过了？</Text>
                        <Button variant="subtle" size="sm" mt="2">补齐进度</Button>
                    </Box>
                    <Box flex="1" borderWidth="1px" rounded="md" p="3">
                        <Icon my="2" fontSize="4xl"><RiEyeCloseFill/></Icon>
                        <Text>只是随便看看</Text>
                        <Button variant="subtle" size="sm" mt="2">仅创建记录</Button>
                    </Box>
                </Flex>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
            </Dialog.CloseTrigger>
        </Dialog.Content>
    )
}
