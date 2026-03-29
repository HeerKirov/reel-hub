import NextLink from "next/link"
import { Alert, Box, Button, Text } from "@chakra-ui/react"
import { RiBuilding2Fill, RiErrorWarningLine, RiShieldUserLine } from "react-icons/ri"
import { UiError } from "@/helpers/error"

export function InlineError({ error, compact = false }: { error: UiError, compact?: boolean }) {
    if(error.code === "NOT_FOUND") {
        return <NotFoundScreen message={error.description} />
    }else if(error.code === "UNAUTHORIZED") {
        return <UnauthorizedScreen message={error.description} />
    }
    return (
        <Box borderWidth="1px" rounded="md" p={compact ? "3" : "4"}>
            <Alert.Root status={error.severity === "error" ? "error" : "warning"}>
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>{error.title}</Alert.Title>
                    <Alert.Description>{error.description}</Alert.Description>
                </Alert.Content>
            </Alert.Root>
            <Text mt="2" color="fg.muted" fontSize="xs">错误码: {error.code}</Text>
        </Box>
    )
}

export function NotFoundScreen({ message }: { message?: string }) {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py="16" gap="4">
            <Box fontSize="4xl" color="orange.400" mb="2">
                <RiErrorWarningLine />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color="orange.700">页面未找到</Text>
            <Text color="fg.muted" mb="2">{message ?? "你访问的页面不存在或已被删除"}</Text>
            <Button asChild variant="solid" colorScheme="orange" size="md" mt="3">
                <NextLink href="/">返回首页</NextLink>
            </Button>
        </Box>
    )
}

export function UnauthorizedScreen({ message }: { message?: string }) {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py="16" gap="4">
            <Box fontSize="4xl" color="teal.500" mb="2">
                <RiShieldUserLine />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color="teal.700">未登录</Text>
            <Text color="fg.muted" mb="2">
                {message ?? "该页面需要登录后才能访问"}
            </Text>
        </Box>
    )
}

export function ComingSoonScreen({ message }: { message?: string }) {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py="16" gap="4">
            <Box fontSize="4xl" color="yellow.400" mb="2">
                <RiBuilding2Fill />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color="yellow.700">施工中</Text>
            <Text color="fg.muted" mb="2">
                {message ?? "该页面正在建设中，敬请期待"}
            </Text>
            <Button asChild variant="solid" colorScheme="yellow" size="md" mt="3">
                <NextLink href="/">返回首页</NextLink>
            </Button>
        </Box>
    )
}