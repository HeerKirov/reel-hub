"use client"
import React, { memo, useRef, useCallback, KeyboardEvent, useMemo } from "react"
import { 
    Input as ChakraInput, InputProps as ChakraInputProps, NumberInput as ChakraNumberInput, NumberInputRootProps as ChakraNumberInputRootProps, 
    RatingGroup, Text, Select as ChakraSelect, Portal, createListCollection 
} from "@chakra-ui/react"
import { ValueChangeDetails as NumberInputValueChangeDetails } from "@zag-js/number-input"
import { ValueChangeDetails as RatingValueChangeDetails } from "@zag-js/rating-group"
import { ValueChangeDetails as SelectValueChangeDetails } from "@zag-js/select"

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
        console.log("change", details.value.length > 0 ? parseFloat(details.value) : null)
        onValueChange?.(details.value.length > 0 ? parseFloat(details.value) : null)
    }, [onValueChange])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && onEnter && value !== undefined && value !== null) {
            onEnter(value)
        }
    }, [onEnter, value])

    const finalValue = value !== undefined && value !== null ? String(value) : ""

    console.log("value", finalValue)

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

