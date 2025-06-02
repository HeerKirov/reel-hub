"use client"
import { memo, useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileAddLine } from "react-icons/ri"
import { PiFileArrowUpBold, PiGenderIntersexBold, PiInfoBold, PiKnifeFill } from "react-icons/pi"
import { Box, Field, Flex, Icon, Textarea } from "@chakra-ui/react"
import { Select, Input } from "@/components/form"
import { TagEditor, DynamicInputList, RatingEditor } from "@/components/editor"
import { AnimeCreateForm, AnimeDetailSchema } from "@/schemas/anime"
import { BoardcastType, OriginalType } from "@/prisma/generated"
import { EditorWithTabLayout } from "@/components/layout"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS, RATING_SEX_ITEMS, RATING_SEX_TO_INDEX, RATING_VIOLENCE_ITEMS, RATING_VIOLENCE_TO_INDEX, REGION_ITEMS } from "@/constants/project"

export type EditorProps = {
    data?: AnimeDetailSchema
    onSubmit?: (data: AnimeCreateForm) => void
    onDelete?: () => void
}

export function Editor({ data, onSubmit, onDelete }: EditorProps) {
    const router = useRouter()
    const [title, setTitle] = useState<string>(data?.title ?? "")
    const [subtitles, setSubtitles] = useState<string[]>(data?.subtitles ?? [])
    const [description, setDescription] = useState<string>(data?.description ?? "")
    const [keywords, setKeywords] = useState<string[]>(data?.keywords ?? [])
    const [tags, setTags] = useState<string[]>([])
    const [ratingSex, setRatingSex] = useState<string | undefined>(data?.ratingS ? RATING_SEX_ITEMS[data.ratingS].value : undefined)
    const [ratingViolence, setRatingViolence] = useState<string | undefined>(data?.ratingV ? RATING_VIOLENCE_ITEMS[data.ratingV].value : undefined)
    const [region, setRegion] = useState<string | undefined>(data?.region ?? undefined)
    const [originalType, setOriginalType] = useState<OriginalType | undefined>(data?.originalType ?? undefined)
    const [boardcastType, setBoardcastType] = useState<BoardcastType | undefined>(data?.boardcastType ?? undefined)
    const [episodeDuration, setEpisodeDuration] = useState<number>(data?.episodeDuration ?? 0)
    const [episodeTotalNum, setEpisodeTotalNum] = useState<number>(data?.episodeTotalNum ?? 0)
    const [episodePublishedNum, setEpisodePublishedNum] = useState<number>(data?.episodePublishedNum ?? 0)

    const breadcrumb = {
        url: "/anime/database",
        detail: data?.title ?? "新建",
        detailIcon: <RiFileAddLine/>
    }

    const tabs = [
        {label: "基本信息", icon: <PiInfoBold/>, content: <BasicInfo 
            title={title} subtitles={subtitles} description={description} keywords={keywords} tags={tags} ratingSex={ratingSex} ratingViolence={ratingViolence} region={region} originalType={originalType} boardcastType={boardcastType} 
            setTitle={setTitle} setSubtitles={setSubtitles} setDescription={setDescription} setKeywords={setKeywords} setTags={setTags} setRatingSex={setRatingSex} setRatingViolence={setRatingViolence} setRegion={setRegion} setOriginalType={setOriginalType} setBoardcastType={setBoardcastType}
        />},
        {label: "资源", icon: <PiFileArrowUpBold/>, content: <Resource/>},
    ]

    const onSave = () => {
        const ratingS = ratingSex ? RATING_SEX_TO_INDEX[ratingSex] : undefined
        const ratingV = ratingViolence ? RATING_VIOLENCE_TO_INDEX[ratingViolence] : undefined
        onSubmit?.({
            title,
            subtitles,
            description,
            keywords,
            ratingS, ratingV,
            region,
            originalType,
            boardcastType,
            episodeDuration,
            episodeTotalNum,
            episodePublishedNum,
        })
    }

    const onCancel = () => {
        router.back()
    }

    return (
        <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onCancel={onCancel} onDelete={onDelete}/>
    )    
}

type BasicInfoProps = {
    title: string
    subtitles: string[]
    description: string
    keywords: string[]
    tags: string[]
    ratingSex: string | undefined
    ratingViolence: string | undefined
    region: string | undefined
    originalType: OriginalType | undefined
    boardcastType: BoardcastType | undefined
    setTitle: (title: string) => void
    setSubtitles: (subtitles: string[]) => void
    setDescription: (description: string) => void
    setKeywords: (keywords: string[]) => void
    setTags: (tags: string[]) => void
    setRatingSex: (ratingSex: string | undefined) => void
    setRatingViolence: (ratingViolence: string | undefined) => void
    setRegion: (region: string | undefined) => void
    setOriginalType: (originalType: OriginalType | undefined) => void
    setBoardcastType: (boardcastType: BoardcastType | undefined) => void
}

const BasicInfo = memo(function BasicInfo({ title, subtitles, description, keywords, tags, ratingSex, ratingViolence, region, originalType, boardcastType, setTitle, setSubtitles, setDescription, setKeywords, setTags, setRatingSex, setRatingViolence, setRegion, setOriginalType, setBoardcastType }: BasicInfoProps) {
    const search = async (text: string): Promise<string[]> => {
        return ["科幻", "奇幻", "剧情", "空气系"].filter(i => i.includes(text))
    }

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
                        <DynamicInputList placeholder="其他标题"  value={subtitles} onValueChange={setSubtitles} />
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
                    <RatingEditor value={ratingSex} options={RATING_SEX_ITEMS} onValueChange={setRatingSex} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        <Icon><PiKnifeFill/></Icon>分级
                    </Field.Label>
                    <RatingEditor value={ratingViolence} options={RATING_VIOLENCE_ITEMS} onValueChange={setRatingViolence} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        地区
                    </Field.Label>
                    <Select value={region} onValueChange={setRegion} items={REGION_ITEMS} placeholder="地区"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        原作类型
                    </Field.Label>
                    <Select value={originalType} onValueChange={setOriginalType} items={ORIGINAL_TYPE_ITEMS} placeholder="原作类型"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        放送类型
                    </Field.Label>
                    <Select value={boardcastType} onValueChange={setBoardcastType} items={BOARDCAST_TYPE_ITEMS} placeholder="放送类型"/>
                </Field.Root>
            </Flex>
        </Flex>
    )
})

const Resource = memo(function Resource() {
    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Flex direction="column" flex="1" gap="1">
                    <Field.Root required>
                        <Field.Label>
                            资源
                        </Field.Label>
                    </Field.Root>
                </Flex>
            </Flex>
        </Flex>
    )
})
