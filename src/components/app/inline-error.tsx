import { Alert, Box, Button, Text } from "@chakra-ui/react"
import { UiError } from "@/helpers/error"

export function InlineError({ error, onRetry, compact = false }: { error: UiError, onRetry?: () => void, compact?: boolean }) {
    return (
        <Box borderWidth="1px" rounded="md" p={compact ? "3" : "4"}>
            <Alert.Root status={error.severity === "error" ? "error" : "warning"}>
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>{error.title}</Alert.Title>
                    <Alert.Description>{error.description}</Alert.Description>
                </Alert.Content>
            </Alert.Root>
            {error.retryable && onRetry && (
                <Button mt="3" size="sm" variant="outline" onClick={onRetry}>
                    重试
                </Button>
            )}
            <Text mt="2" color="fg.muted" fontSize="xs">错误码: {error.code}</Text>
        </Box>
    )
}
