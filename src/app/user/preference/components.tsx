"use client"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Box, Button, Card, Checkbox, Flex, Heading, Text } from "@chakra-ui/react"
import { Select } from "@/components/form"
import { updateUserPreference } from "@/services/user-preference"
import { handleActionResult } from "@/helpers/action"
import type { UserPreferenceSchema } from "@/schemas/user-preference"

const EMPTY_TIMEZONE = "__EMPTY__"
const FALLBACK_TIMEZONES = [
    "UTC",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin"
]

function getSupportedTimezones(): string[] {
    try {
        const values = Intl.supportedValuesOf("timeZone")
        if (values.length > 0) return values
    } catch {
        // ignore
    }
    return FALLBACK_TIMEZONES
}

export function UserPreferenceForm({ initial }: { initial: UserPreferenceSchema }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [timezone, setTimezone] = useState(initial.timezone ?? EMPTY_TIMEZONE)
    const [autoTimezone, setAutoTimezone] = useState(initial.autoTimezone)
    const [nightTimeTable, setNightTimeTable] = useState(initial.nightTimeTable)
    const timezoneItems = useMemo(() => {
        const options = getSupportedTimezones()
        return [{ label: "未设置（使用自动/兜底）", value: EMPTY_TIMEZONE }, ...options.map(item => ({ label: item, value: item }))]
    }, [])

    const detectTimezone = () => {
        try {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
            if (detected) setTimezone(detected)
        } catch {
            // ignore
        }
    }

    const save = async () => {
        const result = handleActionResult(
            await updateUserPreference({
                timezone: timezone === EMPTY_TIMEZONE ? null : timezone,
                autoTimezone,
                nightTimeTable
            }),
            { successTitle: "设置已保存" }
        )
        if (!result.ok) return
        startTransition(() => router.refresh())
    }

    return (
        <Card.Root>
            <Card.Body>
                <Flex direction="column" gap="5">
                    <Box>
                        <Heading size="sm" mb="2">时区</Heading>
                        <Flex mt="2" gap="2" wrap="wrap">
                            <Select width="xs" value={timezone} items={timezoneItems} onValueChange={setTimezone} placeholder="选择时区" />
                            <Button variant="outline" onClick={detectTimezone}>使用当前时区</Button>
                            <Checkbox.Root checked={autoTimezone} onCheckedChange={e => setAutoTimezone(!!e.checked)}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>自动跟随时区</Checkbox.Label>
                            </Checkbox.Root>
                        </Flex>
                        <Text mt="1" fontSize="sm" color="fg.muted">时区会用于周历计算以及统计数据。</Text>
                    </Box>
                    <Box>
                        <Heading size="sm" mb="4">动画</Heading>
                        <Checkbox.Root checked={nightTimeTable} onCheckedChange={e => setNightTimeTable(!!e.checked)}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>夜晚型时间表</Checkbox.Label>
                        </Checkbox.Root>
                        <Text mt="1" fontSize="sm" color="fg.muted">凌晨2:00之前的动画在时间表和周历上算作前一天。</Text>
                    </Box>

                    <Flex justify="flex-end">
                        <Button colorPalette="blue" onClick={save} loading={isPending}>保存</Button>
                    </Flex>
                </Flex>
            </Card.Body>
        </Card.Root>
    )
}