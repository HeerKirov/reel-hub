"use client"
import React, { memo, useState, useCallback } from "react"
import { Box, SystemStyleObject, Tag, Link, Button, Icon, IconButton } from "@chakra-ui/react"
import { useEffectState } from "@/helpers/hooks"
import { Input } from "@/components/form"
import { PiTrashBold } from "react-icons/pi"

export type DynamicInputListProps = {
    value?: string[] | null
    placeholder?: string
    onValueChange?: (value: string[]) => void
}

export const DynamicInputList = memo(function DynamicInputList({ value, onValueChange, placeholder }: DynamicInputListProps) {
    const [list, setList] = useEffectState<string[]>(value ?? [])
    const [newText, setNewText] = useState<string>("")

    const onValueChangeEvent = (index: number) => (value: string) => {
        setList([
            ...list.slice(0, index),
            value,
            ...list.slice(index + 1)
        ])
    }

    const onBlur = useCallback(() => {
        onValueChange?.(list.filter(i => i.trim()))
    }, [list, onValueChange])

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
                <Input key={index} value={item} onValueChange={onValueChangeEvent(index)} onBlur={onBlur} onEnter={onBlur}/>
            ))}
            <Input value={newText} placeholder={placeholder} onValueChange={setNewText} onBlur={onBlurNewText} onEnter={handleEnter}/>
        </>
    )
})

export type TagEditorProps = {
    value?: string[] | null
    placeholder?: string
    onValueChange?: (value: string[]) => void
    variant?: "outline" | "surface"
    noDuplicate?: boolean
    search?: (text: string) => Promise<string[] | undefined>
} & SystemStyleObject

export const TagEditor = memo(function TagEditor({ value, onValueChange, placeholder, variant, noDuplicate = false, search, ...attrs }: TagEditorProps) {
    const [list, setList] = useEffectState<string[]>(value ?? [])
    const [newText, setNewText] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const [searchResults, setSearchResults] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const removeItem = (index: number) => {
        const newList = [...list.slice(0, index), ...list.slice(index + 1)]
        setList(newList)
        onValueChange?.(newList)
    }

    const onValueChangeNewText = useCallback(async (value: string) => {
        setNewText(value)
        if (search) {
            setIsSearching(true)
            try {
                const results = await search(value)
                setSearchResults(results ?? [])
            } catch (error) {
                console.error('Search failed:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        } else {
            setSearchResults([])
        }
    }, [search])

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
        setSearchResults([])
        onValueChange?.(newList)
    }, [list, noDuplicate, onValueChange])

    const handleSearchItemClick = (item: string) => {
        if (noDuplicate && list.includes(item)) return
        const newList = [...list, item]
        setList(newList)
        setNewText("")
        setSearchResults([])
        onValueChange?.(newList)
    }

    const handleFocus = useCallback(async () => {
        setIsFocused(true)
        if (search) {
            setIsSearching(true)
            try {
                const results = await search(newText)
                setSearchResults(results ?? [])
            } catch (error) {
                console.error('Search failed:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }
    }, [search, newText])

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            const activeElement = document.activeElement
            if (activeElement?.closest('[data-search-results]')) {
                return
            }
            setIsFocused(false)
            setSearchResults([])
        }, 100)
    }, [])

    return (
        <Box position="relative" {...attrs}>
            <Box border="1px solid" borderColor="border" rounded="md" bg="bg" display="flex" alignItems="center" gap="1" px="2">
                {list.map((item, index) => (
                    <Tag.Root key={index} variant={variant} flex="1 0 auto">
                        <Tag.Label>{item}</Tag.Label>
                        <Tag.EndElement><Tag.CloseTrigger onClick={() => removeItem(index)}/></Tag.EndElement>
                    </Tag.Root>
                ))}
                <Input variant="flushed" borderWidth="0" _focus={{boxShadow: "none"}} size="sm" width="full" placeholder={placeholder} value={newText} onValueChange={onValueChangeNewText} onEnter={handleEnter} onFocus={handleFocus} onBlur={handleBlur}/>
            </Box>
            {isFocused && (searchResults.length > 0 || isSearching) && (
                <Box position="absolute" top="100%" left="0" right="0" mt="1" border="1px solid" borderColor="border" rounded="md" bg="bg" zIndex="1" p="2" data-search-results>
                    {isSearching ? (
                        <Box color="fg.muted">搜索中...</Box>
                    ) : (
                        <Box display="flex" alignItems="center" gap="1" flexWrap="wrap">
                            {searchResults.map((item, index) => (
                                <Tag.Root key={index} variant={variant} cursor="pointer" _hover={{ bg: "bg.subtle" }} onClick={() => handleSearchItemClick(item)} tabIndex={0} data-search-result>
                                    <Tag.Label>{item}</Tag.Label>
                                </Tag.Root>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    )
})

export type RatingOption<T> = {
    label: string
    value: T
    color: string
    desc: string[]
}

export type RatingEditorProps<T> = {
    value?: T
    options: RatingOption<T>[]
    onValueChange?: (value: T) => void
} & SystemStyleObject

export function RatingEditor<T>({ value, options, onValueChange, ...attrs }: RatingEditorProps<T>) {
    const selectedOption = options.find(option => option.value === value)

    return <Box border="1px solid" borderColor="border" rounded="md" p="3" {...attrs}>
        <Box display="flex" gap="4" mb={selectedOption?.desc.length ? "3" : "0"}>
            {options.map((option, index) => (
                <Link key={index} variant="underline" color={value === option.value ? `${option.color}.fg` : "fg.subtle"} fontWeight={700} onClick={() => onValueChange?.(option.value)}>{option.label}</Link>
            ))}
        </Box>
        {selectedOption?.desc && (
            <Box as="ul" listStyleType="disc" pl="5" color="fg.muted" fontSize="sm" display="flex" flexDirection="column" gap="1">
                {selectedOption.desc.map((text, index) => (
                    <Box as="li" key={index}>{text}</Box>
                ))}
            </Box>
        )}
    </Box>
}

export type StaffEditorProps = {
    value?: {type: string, members: string[]}[]
    onValueChange?: (value: {type: string, members: string[]}[]) => void
    search?: (text: string) => Promise<string[]>
} & SystemStyleObject

export const StaffEditor = memo(function StaffEditor({ value = [], onValueChange, search, ...attrs }: StaffEditorProps) {
    const [staffs, setStaffs] = useEffectState<{type: string, members: string[]}[]>(value)
    const [newType, setNewType] = useState("")

    const onMembersChange = useCallback((type: string) => (members: string[]) => {
        const newStaffs = staffs.map(staff => {
            if(staff.type === type) {
                return {...staff, members}
            }
            return staff
        })
        setStaffs(newStaffs)
        onValueChange?.(newStaffs)
    }, [staffs, onValueChange])

    const onTypeChange = useCallback((oldType: string) => (newType: string) => {
        const newStaffs = staffs.map(staff => {
            if(staff.type === oldType) {
                return {...staff, type: newType}
            }
            return staff
        })
        setStaffs(newStaffs)
        onValueChange?.(newStaffs)
    }, [staffs, onValueChange])

    const onDeleteType = (type: string) => () => {
        const newStaffs = staffs.filter(s => s.type !== type);
        setStaffs(newStaffs)
        onValueChange?.(newStaffs)
    }

    const handleEnter = useCallback((value: string) => {
        if(value.trim()) {
            const newStaffs = [...staffs, {type: value, members: []}]
            setStaffs(newStaffs)
            setNewType("")
            onValueChange?.(newStaffs)
        }
    }, [staffs, onValueChange])

    return (
        <Box display="flex" flexDirection="column" gap="2" {...attrs}>
            {staffs.map((staff, index) => (
                <Box key={index} display="flex" gap="2">
                    <Input flex="1 0 140px" value={staff.type} onValueChange={onTypeChange(staff.type)} placeholder="STAFF类型" />
                    <TagEditor flex="1 1 100%"
                            value={staff.members} 
                            onValueChange={onMembersChange(staff.type)}
                            placeholder="添加STAFF" 
                            variant="surface" 
                            width="full" 
                            noDuplicate 
                            search={search}
                        />
                    <IconButton flex="0 0 auto" variant="ghost" size="sm" onClick={onDeleteType(staff.type)}><PiTrashBold/></IconButton>
                </Box>
            ))}
            <Box display="flex" gap="4">
                <Input flex="1 0 140px" value={newType} onValueChange={setNewType} placeholder="新STAFF类型" onEnter={handleEnter}/>
                <Box flex="1 1 100%" />
                <Box flex="0 0 auto" />
            </Box>
        </Box>
    )
})
