"use client"
import { ChangeEvent, KeyboardEvent, memo, useCallback, useEffect, useState } from "react"
import { Input, InputGroup, SystemStyleObject } from "@chakra-ui/react"
import { RiSearch2Line } from "react-icons/ri"
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