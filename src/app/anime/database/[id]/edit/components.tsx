"use client"
import { useState } from "react"
import { PiGenderIntersexBold, PiKnifeFill } from "react-icons/pi"
import { Box, Field, Flex, Icon, Textarea } from "@chakra-ui/react"
import { Select, Input } from "@/components/form"
import { TagEditor, DynamicInputList, RatingEditor } from "@/components/editor"

export function Editor() {
    const [title, setTitle] = useState<string>("")
    const [otherTitle, setOtherTitle] = useState<string[]>([])
    const [description, setDescription] = useState<string>("")
    const [keywords, setKeywords] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [ratingSex, setRatingSex] = useState<string>()
    const [ratingViolence, setRatingViolence] = useState<string>()
    const [region, setRegion] = useState<string>()
    const [originalType, setOriginalType] = useState<string>()
    const [broadcastType, setBroadcastType] = useState<string>()

    const search = async (text: string): Promise<string[]> => {
        return ["科幻", "奇幻", "剧情", "空气系"].filter(i => i.includes(text))
    }

    const ratingSexItems = [
        {label: "全年龄", value: "all", color: "green", desc: ["无任何性暗示、性倾向、色情内容", "没有任何性暗示倾向的恋爱、接触、轻微裸露行为不会视作限制内容", "可以较为放心地提供给家长和儿童观看"]},
        {label: "R12", value: "r12", color: "cyan", desc: ["有一定的软色情性质的性暗示或低俗内容", "性相关的讨论、轻微的色情内容、轻微的裸露、稍显低俗的内容", "不能放心地提供给家长和儿童观看"]},
        {label: "R15", value: "r15", color: "purple", desc: ["存在明显色情意向的低俗内容或性暗示", "色情话题的讨论、色情裸露、低俗内容", "不要提供给家长和儿童观看，会被打死"]},
        {label: "R17", value: "r17", color: "orange", desc: ["具有强烈的色情意向或露骨的性展示", "性动作暗示、大面积的色情裸露", "公开放送容易引起社会性死亡"]},
        {label: "R18", value: "r18", color: "red", desc: ["以性内容为直接卖点的色情内容", "露点、性行为、性话题的直接讨论", "公开讨论容易引起社会性死亡"]}
    ]

    const ratingViolenceItems = [
        {label: "无限制", value: "no", color: "green", desc: ["无任何暴力、冲突和不当行为", "不涉及冲突和暴力行为的日常类内容，但日常冲突不包括在内", "适合不接受打斗和冲突的所有人"]},
        {label: "A", value: "a", color: "cyan", desc: ["适合青少年、不具有不当行为的暴力或冲突", "普通且广泛的战斗要素、轻微且常见的日常暴力冲突", "适合接受打斗和冲突的所有人"]},
        {label: "B", value: "b", color: "purple", desc: ["存在一定的暴力、不当行为、价值观扭曲", "暴力倾向、轻度凶杀、轻度猎奇和黑暗倾向", "不适合所有人，但普及面仍然广"]},
        {label: "C", value: "c", color: "orange", desc: ["存在较重的暴力、凶杀、其他不当行为", "较重的血腥内容、重度暴力倾向、凶杀和残杀、猎奇和惊悚恐吓内容", "不适合所有人，但普及面仍然广"]},
        {label: "D", value: "d", color: "red", desc: ["存在严重引起生理或心理不适，严重影响三观的内容", "重度的血腥、暴力和凶杀，强烈的猎奇内容，容易留下心理阴影的内容", "不适合所有人，但普及面仍然广"]}
    ]

    const regionItems = [
        {label: "日本", value: "jp"},
        {label: "美国", value: "us"},
        {label: "中国", value: "cn"},
        {label: "韩国", value: "kr"},
        {label: "其他", value: "other"}
    ]

    const originalTypeItems = [
        {label: "原创", value: "original"},
        {label: "漫画改编", value: "manga"},
        {label: "小说改编", value: "novel"},
        {label: "游戏改编", value: "game"},
        {label: "其他", value: "other"}
    ]

    const broadcastTypeItems = [
        {label: "TV&WEB", value: "tv"},
        {label: "剧场版动画", value: "movie"},
        {label: "OVA&OAD", value: "ova"}
    ]

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Flex direction="column" flex="1" gap="1">
                    <Field.Root required>
                        <Field.Label>
                            标题 <Field.RequiredIndicator />
                        </Field.Label>
                        <Input placeholder="标题" value={title} onValueChange={setTitle} />
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
            <Flex flexWrap="wrap" gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        关键词
                    </Field.Label>
                    <TagEditor value={keywords} onValueChange={setKeywords} placeholder="关键词" variant="outline" width="full" noDuplicate/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        标签
                    </Field.Label>
                    <TagEditor value={tags} onValueChange={setTags} placeholder="标签" variant="surface" width="full" noDuplicate search={search}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        <Icon><PiGenderIntersexBold/></Icon>分级
                    </Field.Label>
                    <RatingEditor value={ratingSex} options={ratingSexItems} onValueChange={setRatingSex} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        <Icon><PiKnifeFill/></Icon>分级
                    </Field.Label>
                    <RatingEditor value={ratingViolence} options={ratingViolenceItems} onValueChange={setRatingViolence} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        地区
                    </Field.Label>
                    <Select value={region} onValueChange={setRegion} items={regionItems} placeholder="地区"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        原作类型
                    </Field.Label>
                    <Select value={originalType} onValueChange={setOriginalType} items={originalTypeItems} placeholder="原作类型"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        放送类型
                    </Field.Label>
                    <Select value={broadcastType} onValueChange={setBroadcastType} items={broadcastTypeItems} placeholder="放送类型"/>
                </Field.Root>
            </Flex>
        </Flex>
    )
}

