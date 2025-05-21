"use client"
import { useState } from "react"
import { Field, Flex, Input, Textarea } from "@chakra-ui/react"
import { DynamicInputList } from "@/components/form"

export function Editor() {
    const [title, setTitle] = useState<string>("")
    const [otherTitle, setOtherTitle] = useState<string[]>([])
    const [description, setDescription] = useState<string>("")

    return (
        <Flex flexWrap="wrap">
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
    )
}
