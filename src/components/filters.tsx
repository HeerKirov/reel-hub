"use client"
import { memo, useCallback, useMemo, useState } from "react"
import { Icon, InputGroup, Link, SimpleGrid, SystemStyleObject } from "@chakra-ui/react"
import { RiArrowLeftBoxFill, RiCloseFill, RiSearch2Line } from "react-icons/ri"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffectState } from "@/helpers/hooks"
import { Input } from "@/components/form"

export interface SearchBoxProps extends SystemStyleObject {
    value?: string | null
    placeholder?: string
    onValueChange?: (value: string) => void
    searchParamName?: string
}

export const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const { value, placeholder = "搜索…", onValueChange, searchParamName, ...attrs } = props
    const [text, setText] = useEffectState(value || "")

    const onEnter = useCallback((value: string) => {
        onValueChange?.(value)
        if(searchParamName) {
            const p = new URLSearchParams(searchParams.toString())
            if(value) {
                p.set(searchParamName, value)
            }else{
                p.delete(searchParamName)
            }
            if(p.has("page")) p.delete("page")
            router.push(`?${p.toString()}`)
        }
    }, [onValueChange, searchParamName])

    return (
        <InputGroup endElement={<RiSearch2Line/>} {...attrs}>
            <Input variant="flushed" placeholder={placeholder} value={text} onValueChange={setText} onEnter={onEnter}/>
        </InputGroup>
    )
})

export interface PublishTimePickerProps extends SystemStyleObject {
    value?: string | null
    onValueChange?: (value: string) => void
    searchParamName?: string
    mode?: "month" | "season"
}

export const PublishTimePicker = memo(function PublishTimePicker(props: PublishTimePickerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const years = useMemo(() => Array(new Date().getFullYear() - 1995 + 1).fill(0).map((_, i) => i + 1995).toReversed(), [])
    const months = useMemo(() => props.mode === "season" ? [1, 4, 6, 10] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [props.mode])

    const [step, setStep] = useState<"y" | "m">("y")
    const [currentYear, setYear] = useState<number | undefined>(() => {
        const value = props.value?.split("-", 2)
        return value ? parseInt(value[0]) : undefined
    })
    const [currentMonth, setMonth] = useState<"any" | number | undefined>(() => {
        const value = props.value?.split("-", 2)
        return value ? (value[1] ? parseInt(value[1]) : "any") : undefined
    })

    const selectYear = (selectedYear: number) => {
        setStep("m")
        setYear(selectedYear)
    }

    const selectMonth = (selectedMonth: "any" | number | undefined) => {
        setMonth(selectedMonth)
        if(selectedMonth !== currentMonth) {
            const newValue = typeof selectedMonth === "number" ? `${currentYear}-${selectedMonth}` : `${currentYear}`
            props.onValueChange?.(newValue)
            if(props.searchParamName) {
                const p = new URLSearchParams(searchParams.toString())
                p.set(props.searchParamName, newValue)
                if(p.has("page")) p.delete("page")
                router.push(`?${p.toString()}`)
            }
        }
    }

    const clear = () => {
        if(props.searchParamName) {
            const p = new URLSearchParams(searchParams.toString())
            p.delete(props.searchParamName)
            p.delete("page")
            router.push(`?${p.toString()}`)
        }
    }

    return (
        step === "y" ? <SimpleGrid columns={3} gap="2" py="1">
            {years.map(year => (
                <Link key={year} variant="underline" color={currentYear === year ? "blue.fg" : "fg.subtle"} fontWeight="700" onClick={() => selectYear(year)}>{year}年</Link>
            ))}
            {!!props.value && <Link variant="underline" color="fg.subtle" fontWeight="700" onClick={clear}><Icon><RiCloseFill/></Icon> 清除</Link>}
        </SimpleGrid> : <SimpleGrid columns={2} gap="2" py="1">
            <Link variant="underline" color="blue.fg" fontWeight="700" justifyContent="center" onClick={() => setStep("y")}><RiArrowLeftBoxFill/> {currentYear}年</Link>
            <Link variant="underline" color={currentMonth === "any" ? "blue.fg" : "fg.subtle"} fontWeight="700" justifyContent="center" onClick={() => selectMonth("any")}>任意月份</Link>
            {months.map(month => (
                <Link key={month} variant="underline" color={currentMonth === month ? "blue.fg" : "fg.subtle"} fontWeight="700" justifyContent="center" onClick={() => selectMonth(month)}>
                    {props.mode === "season" ? `${month} - ${month + 2}月` : `${month}月`}
                </Link>
            ))}
        </SimpleGrid>
    )
})
