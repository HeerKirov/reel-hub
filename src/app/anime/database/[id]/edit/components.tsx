"use client"
import { useState } from "react"
import { Box, Field, Flex, Input, Textarea } from "@chakra-ui/react"
import { TagEditor, DynamicInputList } from "@/components/form"

export function Editor() {
    const [title, setTitle] = useState<string>("")
    const [otherTitle, setOtherTitle] = useState<string[]>([])
    const [description, setDescription] = useState<string>("")
    const [keywords, setKeywords] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])


    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Flex direction="column" flex="1" gap="1">
                    <Field.Root required>
                        <Field.Label>
                            标题 <Field.RequiredIndicator />
                        </Field.Label>
                        <Input placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label>
                            其他标题
                        </Field.Label>
                        <DynamicInputList placeholder="其他标题"  value={otherTitle} onValueChange={setOtherTitle} />
                    </Field.Root>
                    <Field.Root required>
                        <Field.Label>
                            简介
                        </Field.Label>
                        <Textarea autoresize placeholder="用不长的文字简要介绍此动画" value={description} onChange={e => setDescription(e.target.value)} />
                    </Field.Root>
                </Flex>
                <Box flex="1" border="1px solid" borderColor="border" rounded="md"/>
            </Flex>
            <Flex gap="4">
                <Field.Root flex="1">
                    <Field.Label>
                        关键词
                    </Field.Label>
                    <TagEditor value={keywords} onValueChange={setKeywords} placeholder="关键词" variant="outline" width="full" noDuplicate/>
                </Field.Root>
                <Field.Root flex="1">
                    <Field.Label>
                        标签
                    </Field.Label>
                    <TagEditor value={tags} onValueChange={setTags} placeholder="标签" variant="surface" width="full" noDuplicate/>
                </Field.Root>
            </Flex>
        </Flex>
    )
}
