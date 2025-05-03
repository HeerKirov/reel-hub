"use client"
import { ChangeEvent, KeyboardEvent, memo, useCallback, useEffect, useMemo, useState } from "react"
import { Flex, Input, InputGroup, Link, SimpleGrid, SystemStyleObject } from "@chakra-ui/react"
import { RiArrowLeftBoxFill, RiSearch2Line } from "react-icons/ri"
import { useRouter, useSearchParams } from "next/navigation"

export type SearchBoxProps = {
    value?: string | null
    placeholder?: string
    onUpdateValue?: (value: string) => void
    searchParamName?: string
} & SystemStyleObject

export const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const { value, placeholder = "搜索…", onUpdateValue, searchParamName, ...attrs } = props
    const [text, setText] = useState(value || "")

    useEffect(() => {
        if(value !== text) setText(value || "")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
    }, [])

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter") {
            onUpdateValue?.(text)
            if(searchParamName) {
                const p = new URLSearchParams(searchParams.toString())
                if(text) {
                    p.set(searchParamName, text)
                }else{
                    p.delete(searchParamName)
                }
                if(p.has("page")) p.delete("page")
                router.push(`?${p.toString()}`)
            }
        }
    }

    return (
        <InputGroup endElement={<RiSearch2Line/>} {...attrs}>
            <Input variant="flushed" placeholder={placeholder} value={text} onChange={onChange} onKeyDown={onKeyDown}/>
        </InputGroup>
    )
})

export type PublishTimePickerProps = {
    value?: string | null
    onUpdateValue?: (value: string) => void
    searchParamName?: string
} & SystemStyleObject

export const PublishTimePicker = memo(function PublishTimePicker(props: PublishTimePickerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const years = useMemo(() => Array(new Date().getFullYear() - 1995 + 1).fill(0).map((_, i) => i + 1995).toReversed(), [])
    const months = useMemo(() => Array(12).fill(0).map((_, i) => i + 1), [])

    const [step, setStep] = useState<"y" | "m">("y")
    const [currentYear, setYear] = useState<number>()
    const [currentMonth, setMonth] = useState<number>()

    const selectYear = (selectedYear: number) => {
        setStep("m")
        setYear(selectedYear)
        if(selectedYear !== currentYear) {
            setMonth(undefined)
            const newValue = `${selectedYear}`
            props.onUpdateValue?.(newValue)
            if(props.searchParamName) {
                const p = new URLSearchParams(searchParams.toString())
                p.set(props.searchParamName, newValue)
                if(p.has("page")) p.delete("page")
                router.push(`?${p.toString()}`)
            }
        }
    }

    const selectMonth = (selectedMonth: number | undefined) => {
        setMonth(selectedMonth)
        if(selectedMonth !== currentMonth) {
            const newValue = selectedMonth !== undefined ? `${currentYear}-${selectedMonth}` : `${currentYear}`
            props.onUpdateValue?.(newValue)
            if(props.searchParamName) {
                const p = new URLSearchParams(searchParams.toString())
                p.set(props.searchParamName, newValue)
                if(p.has("page")) p.delete("page")
                router.push(`?${p.toString()}`)
            }
        }
    }

    return (
        step === "y" ? <SimpleGrid columns={3} gap="2" py="1">
            {years.map(year => (
                <Link key={year} variant="underline" color={currentYear === year ? "blue.fg" : "fg.subtle"} fontWeight="700" onClick={() => selectYear(year)}>{year}年</Link>
            ))}
        </SimpleGrid> : <>
            <Flex justifyContent="space-around">
                <Link variant="underline" color="blue.fg" fontWeight="700" justifyContent="center" onClick={() => setStep("y")}><RiArrowLeftBoxFill/> {currentYear}年</Link>
                <Link variant="underline" color={currentMonth === undefined ? "blue.fg" : "fg.subtle"} fontWeight="700" justifyContent="center" onClick={() => selectMonth(undefined)}>任意月份</Link>
            </Flex>
            <SimpleGrid columns={3} gap="2" py="1">
                {months.map(month => (
                    <Link key={month} variant="underline" color={currentMonth === month ? "blue.fg" : "fg.subtle"} fontWeight="700" justifyContent="center" onClick={() => selectMonth(month)}>{month}月</Link>
                ))}
            </SimpleGrid>
        </>
    )
})