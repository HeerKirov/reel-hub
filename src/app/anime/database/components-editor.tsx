"use client"
import { memo, useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileAddLine } from "react-icons/ri"
import { PiFileArrowUpBold, PiGenderIntersexBold, PiInfoBold, PiKnifeFill } from "react-icons/pi"
import { Box, Field, Flex, Icon, Textarea } from "@chakra-ui/react"
import { Select, Input } from "@/components/form"
import { TagEditor, DynamicInputList, RatingEditor } from "@/components/editor"
import { AnimeForm, AnimeDetailSchema } from "@/schemas/anime"
import { BoardcastType, OriginalType } from "@/prisma/generated"
import { EditorWithTabLayout } from "@/components/layout"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS, RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, RatingSex, RatingViolence, Region, REGION_ITEMS } from "@/constants/project"

export type EditorProps = {
    data?: AnimeDetailSchema
    onSubmit?: (data: AnimeForm) => void
    onDelete?: () => void
}

export function Editor({ data, onSubmit, onDelete }: EditorProps) {
    const router = useRouter()
    const [title, setTitle] = useState<string>(data?.title ?? "")
    const [subtitles, setSubtitles] = useState<string[]>(data?.subtitles ?? [])
    const [description, setDescription] = useState<string>(data?.description ?? "")
    const [keywords, setKeywords] = useState<string[]>(data?.keywords ?? [])
    const [tags, setTags] = useState<string[]>([])
    const [ratingS, setRatingS] = useState<RatingSex | null>(data?.ratingS ?? null)
    const [ratingV, setRatingV] = useState<RatingViolence | null>(data?.ratingV ?? null)
    const [region, setRegion] = useState<Region | null>(data?.region ?? null)
    const [originalType, setOriginalType] = useState<OriginalType | null>(data?.originalType ?? null)
    const [boardcastType, setBoardcastType] = useState<BoardcastType | null>(data?.boardcastType ?? null)
    const [episodeDuration, setEpisodeDuration] = useState<number | null>(data?.episodeDuration ?? null)
    const [episodeTotalNum, setEpisodeTotalNum] = useState<number>(data?.episodeTotalNum ?? 0)
    const [episodePublishedNum, setEpisodePublishedNum] = useState<number>(data?.episodePublishedNum ?? 0)

    const breadcrumb = {
        url: "/anime/database",
        detail: data?.title ?? "新建",
        detailIcon: <RiFileAddLine/>
    }

    const tabs = [
        {label: "基本信息", icon: <PiInfoBold/>, content: <BasicInfo 
            title={title} subtitles={subtitles} description={description} keywords={keywords} tags={tags} 
            ratingS={ratingS} ratingV={ratingV} region={region} originalType={originalType} boardcastType={boardcastType} 
            setTitle={setTitle} setSubtitles={setSubtitles} setDescription={setDescription} setKeywords={setKeywords} setTags={setTags} 
            setRatingS={setRatingS} setRatingV={setRatingV} setRegion={setRegion} setOriginalType={setOriginalType} setBoardcastType={setBoardcastType}
        />},
        {label: "资源", icon: <PiFileArrowUpBold/>, content: <Resource/>},
    ]

    const onSave = () => {
        onSubmit?.({
            title,
            subtitles,
            description,
            keywords,
            ratingS,
            ratingV,
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
    ratingS: RatingSex | null
    ratingV: RatingViolence | null
    region: Region | null
    originalType: OriginalType | null
    boardcastType: BoardcastType | null
    setTitle: (title: string) => void
    setSubtitles: (subtitles: string[]) => void
    setDescription: (description: string) => void
    setKeywords: (keywords: string[]) => void
    setTags: (tags: string[]) => void
    setRatingS: (ratingSex: RatingSex | null) => void
    setRatingV: (ratingViolence: RatingViolence | null) => void
    setRegion: (region: Region | null) => void
    setOriginalType: (originalType: OriginalType | null) => void
    setBoardcastType: (boardcastType: BoardcastType | null) => void
}

const BasicInfo = memo(function BasicInfo(props: BasicInfoProps) {
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
                        <Input placeholder="标题" value={props.title} onValueChange={props.setTitle} />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label>
                            其他标题
                        </Field.Label>
                        <DynamicInputList placeholder="其他标题"  value={props.subtitles} onValueChange={props.setSubtitles} />
                    </Field.Root>
                    <Field.Root required>
                        <Field.Label>
                            简介
                        </Field.Label>
                        <Textarea autoresize placeholder="用不长的文字简要介绍此动画" value={props.description} onChange={e => props.setDescription(e.target.value)} />
                    </Field.Root>
                </Flex>
                <Box flex="1" border="1px solid" borderColor="border" rounded="md"/>
            </Flex>
            <Flex flexWrap="wrap" gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        关键词
                    </Field.Label>
                    <TagEditor value={props.keywords} onValueChange={props.setKeywords} placeholder="关键词" variant="outline" width="full" noDuplicate/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        标签
                    </Field.Label>
                    <TagEditor value={props.tags} onValueChange={props.setTags} placeholder="标签" variant="surface" width="full" noDuplicate search={search}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        <Icon><PiGenderIntersexBold/></Icon>分级
                    </Field.Label>
                    <RatingEditor value={props.ratingS} options={RATING_SEX_ITEMS} onValueChange={props.setRatingS} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        <Icon><PiKnifeFill/></Icon>分级
                    </Field.Label>
                    <RatingEditor value={props.ratingV} options={RATING_VIOLENCE_ITEMS} onValueChange={props.setRatingV} width="full"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        地区
                    </Field.Label>
                    <Select value={props.region} onValueChange={props.setRegion} items={REGION_ITEMS} placeholder="地区"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        原作类型
                    </Field.Label>
                    <Select value={props.originalType} onValueChange={props.setOriginalType} items={ORIGINAL_TYPE_ITEMS} placeholder="原作类型"/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        放送类型
                    </Field.Label>
                    <Select value={props.boardcastType} onValueChange={props.setBoardcastType} items={BOARDCAST_TYPE_ITEMS} placeholder="放送类型"/>
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
