"use client"
import React, { memo, useRef, useCallback, KeyboardEvent, useMemo, useState, useEffect } from "react"
import {
    InputProps as ChakraInputProps, NumberInputRootProps as ChakraNumberInputRootProps, SystemStyleObject,
    Input as ChakraInput, NumberInput as ChakraNumberInput, InputGroup,
    RatingGroup, Text, Select as ChakraSelect, Portal, Popover,
    createListCollection, Link, Box, Group, Button,
    IconButton
} from "@chakra-ui/react"
import { RiCalendar2Fill } from "react-icons/ri"
import { ValueChangeDetails as NumberInputValueChangeDetails } from "@zag-js/number-input"
import { ValueChangeDetails as RatingValueChangeDetails } from "@zag-js/rating-group"
import { ValueChangeDetails as SelectValueChangeDetails } from "@zag-js/select"
import { dates, numbers } from "@/helpers/primitive"
import { PiCheckBold } from "react-icons/pi"

export interface InputProps extends ChakraInputProps {
    onValueChange?: (value: string) => void
    onEnter?: (value: string) => void
}

export const Input = memo(function CompositionInput({ onValueChange, onEnter, onKeyDown, ...props }: InputProps) {
    const composingRef = useRef(false)

    const handleCompositionStart = useCallback(() => {
        composingRef.current = true
    }, [])

    const handleCompositionEnd = useCallback(() => {
        composingRef.current = false
    }, [])

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange?.(e.target.value)
    }, [onValueChange])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !composingRef.current && onEnter) {
            onEnter(e.currentTarget.value)
        }
        onKeyDown?.(e)
    }, [onEnter, onKeyDown])

    return <ChakraInput {...props} onChange={onChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} onKeyDown={handleKeyDown}/>
})

export interface NumberInputProps extends Omit<ChakraNumberInputRootProps, "value" | "onValueChange"> {
    value?: number | null
    placeholder?: string
    onValueChange?: (value: number | null) => void
    onEnter?: (value: number | null) => void
}

export const NumberInput = memo(function NumberInput({ value, onValueChange, onEnter, placeholder, ...props }: NumberInputProps) {

    const change = useCallback((details: NumberInputValueChangeDetails) => {
        onValueChange?.(details.value.length > 0 ? parseFloat(details.value) : null)
    }, [onValueChange])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && onEnter && value !== undefined && value !== null) {
            onEnter(value)
        }
    }, [onEnter, value])

    const finalValue = value !== undefined && value !== null ? String(value) : ""

    return <ChakraNumberInput.Root value={finalValue} onValueChange={change} onKeyDown={handleKeyDown} {...props}>
        <ChakraNumberInput.Control/>
        <ChakraNumberInput.Input placeholder={placeholder}/>
    </ChakraNumberInput.Root>

})

export interface StarlightProps {
    value?: number
    onValueChange?: (value: number) => void
    disabled?: boolean
}

export const Starlight = memo(function Starlight({ value, onValueChange, disabled }: StarlightProps) {
    const change = (details: RatingValueChangeDetails) => onValueChange?.(details.value * 2)

    return (
        <RatingGroup.Root allowHalf count={5} value={value ? value / 2 : undefined} colorPalette="orange" disabled={disabled} onValueChange={change}>
            <Text width="20px" color="orange.solid" fontWeight="700" textAlign="center" mr="1">{value ?? "?"}</Text>
            <RatingGroup.HiddenInput/>
            <RatingGroup.Control/>
        </RatingGroup.Root>
    )
})

export interface SelectItem<T extends string> {
    label: string
    value: T
}

export interface SelectProps<T extends string> {
    value?: T | null
    items: SelectItem<T>[]
    onValueChange?: (value: T) => void
    placeholder?: string
}

export function Select<T extends string>({ value, items, onValueChange, placeholder, ...attrs }: SelectProps<T>) {
    const collection = useMemo(() => createListCollection({ items }), [items])

    const onValueChangeEvent = useCallback((e: SelectValueChangeDetails<T>) => {
        const selectedValue = e.value[0] as T
        onValueChange?.(selectedValue)
    }, [onValueChange])
    
    return <ChakraSelect.Root collection={collection as any} value={value !== null && value !== undefined ? [value] : []} onValueChange={onValueChangeEvent} {...attrs}>
        <ChakraSelect.HiddenSelect/>
        <ChakraSelect.Control>
            <ChakraSelect.Trigger>
                <ChakraSelect.ValueText placeholder={placeholder}/>
            </ChakraSelect.Trigger>
            <ChakraSelect.IndicatorGroup>
                <ChakraSelect.Indicator/>
            </ChakraSelect.IndicatorGroup>
        </ChakraSelect.Control>
        <Portal>
            <ChakraSelect.Positioner>
                <ChakraSelect.Content>
                    {items.map(item => (
                        <ChakraSelect.Item item={item} key={item.value}>
                            {item.label}
                            <ChakraSelect.ItemIndicator/>
                        </ChakraSelect.Item>
                    ))}
                </ChakraSelect.Content>
            </ChakraSelect.Positioner>
        </Portal>
    </ChakraSelect.Root>
}

export interface DateTimePickerProps {
    id?: string
    value?: string | null
    onValueChange?: (value: string | null) => void
    mode?: "year" | "month" | "day" | "time"
    placeholder?: string
}

export const DateTimePicker = memo(function DateTimePicker(props: DateTimePickerProps & SystemStyleObject) {
    const { value, onValueChange, mode, placeholder = "YYYY-MM-DD", ...attrs } = props

    return (
        <Popover.Root {...attrs}>
            <Popover.Trigger asChild>
                <InputGroup endElement={<RiCalendar2Fill/>}>
                    <ChakraInput readOnly={true} placeholder={placeholder} value={value ?? ""}/>
                </InputGroup>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content>
                        <Popover.Arrow />
                        <Popover.Body>
                            <DateTimePickerPopover value={value} onValueChange={onValueChange} mode={mode}/>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
})

const DateTimePickerPopover = memo(function DateTimePickerPopover(props: DateTimePickerProps) {
    const { value, onValueChange, mode = "time" } = props

    const [date, setDate] = useState<{year: number, month: number, day: number, hour: number, minute: number}>(() => {
        const d = value ? dates.parseStandardText(value) ?? new Date() : new Date()
        return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes()}
    })

    // 根据mode确定初始面板
    const getInitialPanel = useCallback(() => {
        const panelOrder: Array<"year" | "month" | "day" | "time"> = ["year", "month", "day", "time"]
        const modeIndex = panelOrder.indexOf(mode)
        return panelOrder[modeIndex] || "day"
    }, [mode])

    const [currentPanel, setCurrentPanel] = useState<"year" | "month" | "day" | "time">(getInitialPanel)

    // 直接使用useMemo计算可见的tabs
    const visibleTabs = useMemo(() => {
        const panelOrder: Array<"year" | "month" | "day" | "time"> = ["year", "month", "day", "time"]
        const modeIndex = panelOrder.indexOf(mode)
        return panelOrder.slice(0, modeIndex + 1)
    }, [mode])

    // 更新日期并处理面板切换逻辑
    const updateDate = useCallback((updates: Partial<typeof date>) => {
        const newDate = { ...date, ...updates }
        setDate(newDate)
        
        // 如果当前面板是mode指定的终点，则传递完整值
        if (currentPanel === mode) {
            let dateStr = ""
            if (mode === "year") {
                dateStr = `${newDate.year}`
            } else if (mode === "month") {
                dateStr = `${newDate.year}-${numbers.zero(newDate.month, 2)}`
            } else if (mode === "day") {
                dateStr = `${newDate.year}-${numbers.zero(newDate.month, 2)}-${numbers.zero(newDate.day, 2)}`
            } else if (mode === "time") {
                dateStr = `${newDate.year}-${numbers.zero(newDate.month, 2)}-${numbers.zero(newDate.day, 2)} ${numbers.zero(newDate.hour, 2)}:${numbers.zero(newDate.minute, 2)}`
            }
            onValueChange?.(dateStr)
        } else {
            // 否则跳转到下一个面板
            const panelOrder: Array<"year" | "month" | "day" | "time"> = ["year", "month", "day", "time"]
            const currentIndex = panelOrder.indexOf(currentPanel)
            const nextPanel = panelOrder[currentIndex + 1]
            if (nextPanel && panelOrder.indexOf(nextPanel) <= panelOrder.indexOf(mode)) {
                setCurrentPanel(nextPanel)
            }
        }
    }, [date, currentPanel, mode, onValueChange])

    // 生成年份选项 (从1995年到当前年份+1年，倒序排列)
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear()
        const startYear = 1995
        const endYear = currentYear + 1
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)
    }, [])

    // 生成月份选项
    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])

    // 生成日期选项 (根据当前年月，包含周几信息)
    const dayOptions = useMemo(() => {
        const daysInMonth = new Date(date.year, date.month, 0).getDate()
        const firstDayOfMonth = new Date(date.year, date.month - 1, 1)
        // 获取第一天是周几 (0=Sunday -> 6=Saturday)
        const firstDayWeekday = firstDayOfMonth.getDay()
        // 转换为以周一为起点的偏移量 (0=Monday -> 6=Sunday)
        const firstDayOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1
        
        // 生成实际日期
        return {
            // 需要在前面填充的空格数量
            emptyDays: firstDayOffset,
            // 实际日期数据
            days: Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateObj = new Date(date.year, date.month - 1, day)
                const weekday = dateObj.getDay()
                // 转换为以周一为起点的weekday名称
                const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                const adjustedWeekday = weekday === 0 ? 6 : weekday - 1
                return {
                    day,
                    weekday: weekdayNames[adjustedWeekday]
                }
            })
        }
    }, [date.year, date.month])

    // 添加临时时间状态
    const [tempTime, setTempTime] = useState<{hour: number, minute: number}>(() => ({
        hour: date.hour,
        minute: date.minute
    }))

    // 当date变化时更新临时时间
    useEffect(() => {
        setTempTime({
            hour: date.hour,
            minute: date.minute
        })
    }, [date.hour, date.minute])

    // 时间调整函数（只修改临时状态）
    const adjustTime = useCallback((type: 'hour' | 'minute', delta: number) => {
        setTempTime(prev => {
            if (type === 'hour') {
                return {
                    ...prev,
                    hour: (prev.hour + delta + 24) % 24
                }
            } else {
                return {
                    ...prev,
                    minute: (prev.minute + delta + 60) % 60
                }
            }
        })
    }, [])

    // 确认时间选择
    const confirmTimeSelection = useCallback(() => {
        updateDate({ hour: tempTime.hour, minute: tempTime.minute })
    }, [tempTime, updateDate])

    return (
        <>
            <Group>
                {visibleTabs.includes("year") && (
                    <Link variant="underline" color={currentPanel === "year" ? `blue.fg` : "fg.subtle"} fontWeight={700} onClick={() => setCurrentPanel("year")}>{date.year}年</Link>
                )}
                {visibleTabs.includes("month") && (
                    <Link variant="underline" color={currentPanel === "month" ? `blue.fg` : "fg.subtle"} fontWeight={700} onClick={() => setCurrentPanel("month")}>{date.month}月</Link>
                )}
                {visibleTabs.includes("day") && (
                    <Link variant="underline" color={currentPanel === "day" ? `blue.fg` : "fg.subtle"} fontWeight={700} onClick={() => setCurrentPanel("day")}>{date.day}日</Link>
                )}
                {visibleTabs.includes("time") && (
                    <Link variant="underline" color={currentPanel === "time" ? `blue.fg` : "fg.subtle"} fontWeight={700} onClick={() => setCurrentPanel("time")}>{numbers.zero(date.hour, 2)}:{numbers.zero(date.minute, 2)}</Link>
                )}
            </Group>
            <Box maxHeight="200px" overflowY="auto" mt="2">
                {currentPanel === "year" ? (
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1">
                        {yearOptions.map(year => (
                            <Box key={year} p="2" textAlign="center" cursor="pointer" borderRadius="md"
                                bg={date.year === year ? "blue.500" : "transparent"}
                                color={date.year === year ? "white" : "fg.default"}
                                _hover={{ bg: date.year === year ? "blue.600" : "gray.100" }}
                                onClick={() => updateDate({ year })}>
                                {year}
                            </Box>
                        ))}
                    </Box>
                ) : currentPanel === "month" ? (
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1">
                        {monthOptions.map(month => (
                            <Box key={month} p="2" textAlign="center" cursor="pointer" borderRadius="md"
                                bg={date.month === month ? "blue.500" : "transparent"}
                                color={date.month === month ? "white" : "fg.default"}
                                _hover={{ bg: date.month === month ? "blue.600" : "gray.100" }}
                                onClick={() => updateDate({ month })}>
                                {month}月
                            </Box>
                        ))}
                    </Box>
                ) : currentPanel === "day" ? (
                    <Box>
                        {/* 周几标题行 - 从周一开始 */}
                        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="1" mb="2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(weekday => (
                                <Box key={weekday} textAlign="center" fontSize="xs" color="fg.muted" fontWeight="bold" p="1">
                                    {weekday}
                                </Box>
                            ))}
                        </Box>
                        {/* 日期网格 */}
                        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="1">
                            {/* 填充空白日期 */}
                            {Array.from({ length: dayOptions.emptyDays }).map((_, index) => (
                                <Box key={`empty-${index}`} p="2"/>
                            ))}
                            {/* 实际日期 */}
                            {dayOptions.days.map(({ day, weekday }) => (
                                <Box
                                    key={day}
                                    p="2"
                                    textAlign="center"
                                    cursor="pointer"
                                    borderRadius="md"
                                    bg={date.day === day ? "blue.500" : "transparent"}
                                    color={date.day === day ? "white" : "fg.default"}
                                    _hover={{ bg: date.day === day ? "blue.600" : "gray.100" }}
                                    onClick={() => updateDate({ day })}
                                    title={`${day}日 ${weekday}`}
                                >
                                    {day}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Box display="flex" justifyContent="center" alignItems="center" gap="4">
                            {/* 小时选择器 */}
                            <Box display="flex" flexDirection="column" alignItems="center" gap="1">
                                <Button size="sm" variant="ghost" onClick={() => adjustTime('hour', 1)} py="1" px="3" minW="auto" h="auto">
                                    +
                                </Button>
                                <Box p="3" border="1px solid" borderColor="border" bg="bg.subtle" minW="60px" textAlign="center" fontSize="lg" fontWeight="bold">
                                    {numbers.zero(tempTime.hour, 2)}
                                </Box>
                                <Button size="sm" variant="ghost" onClick={() => adjustTime('hour', -1)} py="1" px="3" minW="auto" h="auto">
                                    -
                                </Button>
                            </Box>

                            <Text fontSize="lg" fontWeight="bold">:</Text>

                            {/* 分钟选择器 */}
                            <Box display="flex" flexDirection="column" alignItems="center" gap="1">
                                <Button size="sm" variant="ghost" onClick={() => adjustTime('minute', 5)} py="1" px="3" minW="auto" h="auto">
                                    +
                                </Button>
                                <Box
                                    p="3" border="1px solid" borderColor="border" bg="bg.subtle" minW="60px" textAlign="center" fontSize="lg" fontWeight="bold">
                                    {numbers.zero(tempTime.minute, 2)}
                                </Box>
                                <Button size="sm" variant="ghost" onClick={() => adjustTime('minute', -5)} py="1" px="3" minW="auto" h="auto">
                                    -
                                </Button>
                            </Box>

                            {/* 确认按钮 */}
                            <Box display="flex" flexDirection="column" justifyContent="center" ml="2">
                                <IconButton variant="subtle" colorPalette="blue" color="colorPalette" size="sm" onClick={confirmTimeSelection}>
                                    <PiCheckBold/>
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </>
    )
})