"use client"
import { ChangeEvent, KeyboardEvent, memo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Input } from "@chakra-ui/react"
import { RiArrowRightLine } from "react-icons/ri"

export const PageRouterPopover = memo(function PageRouterPopover(props: {page: number, total: number, pageParamName: string}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [page, setPage] = useState<string>(String(props.page))

    useEffect(() => setPage(String(props.page)), [props.page])

    const onClick = () => {
        const p = new URLSearchParams(searchParams.toString())
        p.set(props.pageParamName, page)
        router.push(`?${p.toString()}`)
    }

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPage(e.target.value)
    }

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter") {
            onClick()
        }
    }

    return (
        <>
            <Input type="number" placeholder="页码" size="sm" min="1" max={props.total} value={page} onChange={onChange} onKeyDown={onKeyDown}/>
            <Button type="submit" variant="outline" size="sm" onClick={onClick}><RiArrowRightLine/> 跳转</Button>
        </>
    )
})