"use client"
import React, { memo, useState } from "react"
import { Input, RatingGroup, Text } from "@chakra-ui/react"
import { ValueChangeDetails } from "@zag-js/rating-group"
import { useEffectState } from "@/helpers/hooks"

export type StarlightProps = {
    value?: number
    onValueChange?: (value: number) => void
    disabled?: boolean
}

export const Starlight = memo(function Starlight({ value, onValueChange, disabled }: StarlightProps) {
    const change = (details: ValueChangeDetails) => onValueChange?.(details.value * 2)

    return (
        <RatingGroup.Root allowHalf count={5} value={value ? value / 2 : undefined} colorPalette="orange" disabled={disabled} onValueChange={change}>
            <Text width="20px" color="orange.solid" fontWeight="700" textAlign="center" mr="1">{value ?? "?"}</Text>
            <RatingGroup.HiddenInput/>
            <RatingGroup.Control/>
        </RatingGroup.Root>
    )
})

export type DynamicInputListProps = {
    value?: string[] | null
    placeholder?: string
    onValueChange?: (value: string[]) => void
}

export const DynamicInputList = memo(function DynamicInputList({ value, onValueChange, placeholder }: DynamicInputListProps) {
    const [list, setList] = useEffectState<string[]>(value ?? [])
    const [newText, setNewText] = useState<string>("")

    const onChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setList([
            ...list.slice(0, index),
            e.target.value,
            ...list.slice(index + 1)
        ])
    }

    const onBlur = () => {
        onValueChange?.(list.filter(i => i.trim()))
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter") {
            onValueChange?.(list.filter(i => i.trim()))
        }
    }

    const onChangeNewText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewText(e.target.value)
    }

    const onBlurNewText = () => {
        if(newText.trim()) {
            setList([...list, newText])
            setNewText("")
            onValueChange?.([...list, newText])
        }
    }

    const onKeyDownNewText = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter" && newText.trim()) {
            setList([...list, newText])
            setNewText("")
            onValueChange?.([...list, newText])
        }
    }

    return (
        <>
            {list.map((item, index) => (
                <Input key={index} value={item} onChange={onChange(index)} onBlur={onBlur} onKeyDown={onKeyDown}/>
            ))}
            <Input value={newText} placeholder={placeholder} onChange={onChangeNewText} onBlur={onBlurNewText} onKeyDown={onKeyDownNewText}/>
        </>
    )
})
