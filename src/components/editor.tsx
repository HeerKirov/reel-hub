"use client"
import React, { memo, useState, useCallback, useEffect } from "react"
import { Box, SystemStyleObject, Tag, Link, Button, Icon, IconButton } from "@chakra-ui/react"
import { useEffectState } from "@/helpers/hooks"
import { Input } from "@/components/form"
import { PiTrashBold } from "react-icons/pi"
import { ProjectRelationType } from "@/schemas/project"
import { RelationType, RELATION_TYPE_NAMES, RELATION_TYPE_VALUES, ProjectType } from "@/constants/project"

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

export type RelationEditorProps = {
    value?: Partial<ProjectRelationType>
    onValueChange?: (value: Partial<ProjectRelationType>) => void
    search?: (text: string) => Promise<{id: string, type: ProjectType, title: string}[]>
} & SystemStyleObject

export const RelationEditor = memo(function RelationEditor({ value = {}, onValueChange, search, ...attrs }: RelationEditorProps) {
    const [relations, setRelations] = useState<Partial<ProjectRelationType>>(value)
    const [selectedType, setSelectedType] = useState<RelationType>("PREV")
    const [searchText, setSearchText] = useState("")
    const [searchResults, setSearchResults] = useState<{id: string, type: ProjectType, title: string}[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isDraggingOver, setIsDraggingOver] = useState(false)

    // 更新关系数据
    const updateRelations = useCallback((newRelations: Partial<ProjectRelationType>) => {
        setRelations(newRelations)
        onValueChange?.(newRelations)
    }, [onValueChange])

    // 添加项目到指定类型
    const addProjectToType = useCallback((type: RelationType, project: {id: string, type: ProjectType, title: string}) => {
        const currentList = relations[type] || []
        if (currentList.some(item => item.id === project.id)) return // 避免重复添加
        
        // 转换为 ProjectRelationType 中的项目格式
        const projectItem = {
            id: project.id,
            title: project.title,
            resources: {}
        }
        const newList = [...currentList, projectItem]
        const newRelations = { ...relations, [type]: newList }
        updateRelations(newRelations)
    }, [relations, updateRelations])

    // 从指定类型移除项目
    const removeProjectFromType = useCallback((type: RelationType, projectId: string) => {
        const currentList = relations[type] || []
        const newList = currentList.filter(item => item.id !== projectId)
        const newRelations = { ...relations, [type]: newList }
        updateRelations(newRelations)
    }, [relations, updateRelations])

    // 移动项目到新类型
    const moveProjectToType = useCallback((fromType: RelationType, toType: RelationType, projectId: string) => {
        const fromList = relations[fromType] || []
        const project = fromList.find(item => item.id === projectId)
        if (!project) return

        const newFromList = fromList.filter(item => item.id !== projectId)
        const toList = relations[toType] || []
        const newToList = [...toList, project]
        
        const newRelations = { 
            ...relations, 
            [fromType]: newFromList,
            [toType]: newToList
        }
        updateRelations(newRelations)
    }, [relations, updateRelations])

    // 执行搜索
    const executeSearch = useCallback(async (text: string) => {
        if (!search || !text.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const results = await search(text)
            setSearchResults(results || [])
        } catch (error) {
            console.error('Search failed:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [search])

    // 搜索防抖效果
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            executeSearch(searchText)
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchText])

    // 处理搜索文本变化
    const handleSearchTextChange = useCallback((text: string) => {
        setSearchText(text)
    }, [])

    // 处理拖拽开始
    const handleDragStart = useCallback((e: React.DragEvent, projectId: string, type: RelationType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ projectId, type }))
    }, [])

    // 处理搜索结果拖拽开始
    const handleSearchResultDragStart = useCallback((e: React.DragEvent, project: {id: string, type: ProjectType, title: string}) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ 
            projectId: project.id, 
            type: 'SEARCH_RESULT',
            projectData: project 
        }))
    }, [])

    // 处理拖拽结束
    const handleDragEnd = useCallback(() => {
        setIsDraggingOver(false)
    }, [])

    // 处理拖拽悬停
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(true)
    }, [])

    // 处理拖拽离开
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(false)
    }, [])

    // 处理拖拽放置
    const handleDrop = useCallback((e: React.DragEvent, targetType: RelationType) => {
        e.preventDefault()
        setIsDraggingOver(false)
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'))
            const { projectId, type: sourceType, projectData } = data
            
            if (sourceType === 'SEARCH_RESULT') {
                // 从搜索结果拖拽到左侧
                if (projectData) {
                    addProjectToType(targetType, projectData)
                }
            } else if (sourceType === targetType) {
                // 同类型不处理
                return
            } else {
                // 从左侧拖拽到其他类型
                moveProjectToType(sourceType, targetType, projectId)
            }
        } catch (error) {
            console.error('Drop data parsing failed:', error)
        }
    }, [moveProjectToType, addProjectToType])

    // 处理搜索区域拖拽放置
    const handleSearchAreaDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(false)
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'))
            const { projectId, type: sourceType } = data
            
            if (sourceType === 'SEARCH_RESULT') {
                // 从搜索结果拖拽到搜索区域，不做任何操作
                return
            }
            
            removeProjectFromType(sourceType, projectId)
        } catch (error) {
            console.error('Drop data parsing failed:', error)
        }
    }, [removeProjectFromType])

    // 处理双击添加
    const handleDoubleClick = useCallback((project: {id: string, type: ProjectType, title: string}) => {
        addProjectToType(selectedType, project)
    }, [selectedType, addProjectToType])

    // 获取当前选中类型的项目数量
    const getCurrentTypeCount = useCallback((type: RelationType) => {
        return relations[type]?.length || 0
    }, [relations])

    return (
        <Box display="flex" flexWrap={{base: "wrap", md: "nowrap"}} gap="4" {...attrs}>
            <Box display="flex" gap="4" width="full">
                <Box display="flex" flexDirection="column" gap="2" minWidth="120px">
                    {RELATION_TYPE_VALUES.map(type => (
                        <Button
                            key={type}
                            variant={selectedType === type ? "solid" : "outline"}
                            colorPalette={selectedType === type ? "blue" : undefined}
                            size="sm"
                            onClick={() => setSelectedType(type)}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            onDragOver={(e) => {
                                e.preventDefault()
                            }}
                            onDrop={(e) => handleDrop(e, type)}
                        >
                            <Box>{RELATION_TYPE_NAMES[type]}</Box>
                            <Tag.Root size="sm" variant="solid" colorPalette="gray">
                                <Tag.Label>{getCurrentTypeCount(type)}</Tag.Label>
                            </Tag.Root>
                        </Button>
                    ))}
                </Box>

                <Box flex="1" border="1px solid" borderColor="border" rounded="md" p="3" minHeight="200px"
                     onDragOver={(e) => {
                         e.preventDefault()
                     }}
                     onDrop={(e) => handleDrop(e, selectedType)}
                >
                    <Box fontSize="sm" fontWeight="bold" mb="2" color="fg.muted">
                        {RELATION_TYPE_NAMES[selectedType]} ({getCurrentTypeCount(selectedType)})
                    </Box>
                    <Box display="flex" flexDirection="column" gap="2">
                        {(relations[selectedType] || []).map((project, index) => (
                            <Box
                                key={project.id}
                                p="2"
                                border="1px solid"
                                borderColor="border"
                                rounded="md"
                                bg="bg.subtle"
                                cursor="grab"
                                draggable
                                onDragStart={(e) => handleDragStart(e, project.id, selectedType)}
                                onDragEnd={handleDragEnd}
                                _hover={{ bg: "bg.muted" }}
                            >
                                <Box fontWeight="bold" fontSize="sm">{project.title}</Box>
                            </Box>
                        ))}
                        {(relations[selectedType] || []).length === 0 && (
                            <Box textAlign="center" color="fg.muted" fontSize="sm" py="8">
                                暂无项目
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap="4" width={{base: "full", md: "70%"}}>
                {/* 搜索框 */}
                <Box>
                    <Input
                        placeholder="搜索项目..."
                        value={searchText}
                        onValueChange={handleSearchTextChange}
                    />
                </Box>

                {/* 搜索结果 */}
                <Box 
                    border="1px solid" 
                    borderColor="border" 
                    rounded="md" 
                    p="3" 
                    minHeight="200px"
                    position="relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleSearchAreaDrop}
                >
                    {/* 拖拽覆盖层 */}
                    {isDraggingOver && (
                        <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="blackAlpha.200"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            rounded="md"
                            zIndex="1"
                        >
                            <Box textAlign="center" color="fg" fontWeight="bold">
                                拖拽到此处移除项目
                            </Box>
                        </Box>
                    )}

                    <Box fontSize="sm" fontWeight="bold" mb="2" color="fg.muted">
                        搜索结果
                    </Box>
                    
                    {isSearching ? (
                        <Box textAlign="center" color="fg.muted" fontSize="sm" py="8">
                            搜索中...
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" gap="2">
                            {searchResults.map(project => (
                                <Box
                                    key={project.id}
                                    p="2"
                                    border="1px solid"
                                    borderColor="border"
                                    rounded="md"
                                    bg="bg.subtle"
                                    cursor="grab"
                                    draggable
                                    onDragStart={(e) => handleSearchResultDragStart(e, project)}
                                    onDragEnd={handleDragEnd}
                                    onDoubleClick={() => handleDoubleClick(project)}
                                    _hover={{ bg: "bg.muted" }}
                                >
                                    <Box fontWeight="bold" fontSize="sm">{project.title}</Box>
                                </Box>
                            ))}
                            {searchResults.length === 0 && searchText && !isSearching && (
                                <Box textAlign="center" color="fg.muted" fontSize="sm" py="8">
                                    未找到项目
                                </Box>
                            )}
                            {!searchText && (
                                <Box textAlign="center" color="fg.muted" fontSize="sm" py="8">
                                    输入关键词开始搜索
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    )
})

