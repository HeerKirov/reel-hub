"use client"
import React, { memo, useState, useCallback, KeyboardEvent } from "react"
import { Box, Input, InputProps, RatingGroup, SystemStyleObject, Tag, Text } from "@chakra-ui/react"
import { ValueChangeDetails } from "@zag-js/rating-group"
import { useEffectState } from "@/helpers/hooks"

export type CompositionInputProps = {
    onEnter?: (value: string) => void
} & InputProps

export const CompositionInput = memo(function CompositionInput({ onEnter, onKeyDown, ...props }: CompositionInputProps) {
    const [isComposing, setIsComposing] = useState(false)

    const handleCompositionStart = useCallback(() => {
        setIsComposing(true)
    }, [])

    const handleCompositionEnd = useCallback(() => {
        setIsComposing(false)
    }, [])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isComposing && onEnter) {
            onEnter(e.currentTarget.value)
        }
        onKeyDown?.(e)
    }, [isComposing, onEnter, onKeyDown])

    return <Input {...props} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} onKeyDown={handleKeyDown}/>
})

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

    const onBlur = useCallback(() => {
        onValueChange?.(list.filter(i => i.trim()))
    }, [list, onValueChange])
    
    const onChangeNewText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewText(e.target.value)
    }, [])

    const onBlurNewText = () => {
        if(newText.trim()) {
            setList([...list, newText])
            setNewText("")
            onValueChange?.([...list, newText])
        }
    }

    const handleEnter = useCallback((value: string) => {
        if(value.trim()) {
            setList([...list, value])
            setNewText("")
            onValueChange?.([...list, value])
        }
    }, [list, onValueChange])

    return (
        <>
            {list.map((item, index) => (
                <CompositionInput key={index} value={item} onChange={onChange(index)} onBlur={onBlur} onEnter={onBlur}/>
            ))}
            <CompositionInput value={newText} placeholder={placeholder} onChange={onChangeNewText} onBlur={onBlurNewText} onEnter={handleEnter}/>
        </>
    )
})

export type TagEditorProps = {
    value?: string[] | null
    placeholder?: string
    onValueChange?: (value: string[]) => void
    variant?: "outline" | "surface"
    noDuplicate?: boolean
} & SystemStyleObject

export const TagEditor = memo(function TagEditor({ value, onValueChange, placeholder, variant, noDuplicate = false, ...attrs }: TagEditorProps) {
    const [list, setList] = useEffectState<string[]>(value ?? [])
    const [newText, setNewText] = useState<string>("")

    const removeItem = (index: number) => {
        const newList = [...list.slice(0, index), ...list.slice(index + 1)]
        setList(newList)
        onValueChange?.(newList)
    }

    const onChangeNewText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewText(e.target.value)
    }

    const handleEnter = useCallback((value: string) => {
        const trimmedText = value.trim()
        if (!trimmedText) return
        
        if (noDuplicate && list.includes(trimmedText)) {
            setNewText("")
            return
        }
        const newList = [...list, trimmedText]
        setList(newList)
        setNewText("")
        onValueChange?.(newList)
    }, [list, noDuplicate, onValueChange])

    return (
        <Box border="1px solid" borderColor="border" rounded="md" bg="bg" display="flex" alignItems="center" gap="1" px="2" {...attrs}>
            {list.map((item, index) => (
                <Tag.Root key={index} variant={variant}>
                    <Tag.Label>{item}</Tag.Label>
                    <Tag.EndElement><Tag.CloseTrigger onClick={() => removeItem(index)}/></Tag.EndElement>
                </Tag.Root>
            ))}
            <CompositionInput variant="flushed" borderWidth="0" _focus={{boxShadow: "none"}} placeholder={placeholder} value={newText} onChange={onChangeNewText} onEnter={handleEnter} size="sm" width="full"/>
        </Box>
    )
})
