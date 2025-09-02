"use client"
import { memo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { RiFileAddLine, RiLink, RiTvLine } from "react-icons/ri"
import { PiGenderIntersexBold, PiInfoBold, PiKnifeFill, PiUserBold } from "react-icons/pi"
import { Box, Field, Flex, Icon, Textarea } from "@chakra-ui/react"
import { Select, Input, NumberInput, DateTimePicker } from "@/components/form"
import { TagEditor, DynamicInputList, RatingEditor, StaffEditor, RelationEditor, EpisodePublishedRecordEditor } from "@/components/editor"
import { EditorWithTabLayout } from "@/components/layout"
import { AnimeForm, AnimeDetailSchema } from "@/schemas/anime"
import { EpisodePublishRecord, ProjectRelationModel, ProjectRelationType } from "@/schemas/project"
import { BOARDCAST_TYPE_ITEMS, ORIGINAL_TYPE_ITEMS } from "@/constants/anime"
import { RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, RatingSex, RatingViolence, Region, REGION_ITEMS, ProjectType } from "@/constants/project"
import { BoardcastType, OriginalType } from "@/constants/anime"
import { listTags } from "@/services/tag"
import { listStaffs } from "@/services/staff"
import { listProject } from "@/services/project"

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
    const [tags, setTags] = useState<string[]>(data?.tags.map(t => t.name) ?? [])
    const [staffs, setStaffs] = useState<{type: string, members: string[]}[]>(data?.staffs.map(s => ({type: s.type, members: s.members.map(m => m.name)})) ?? [])
    const [ratingS, setRatingS] = useState<RatingSex | null>(data?.ratingS ?? null)
    const [ratingV, setRatingV] = useState<RatingViolence | null>(data?.ratingV ?? null)
    const [region, setRegion] = useState<Region | null>(data?.region ?? "jp")
    const [publishTime, setPublishTime] = useState<string | null>(data?.publishTime ?? null)
    const [originalType, setOriginalType] = useState<OriginalType | null>(data?.originalType ?? null)
    const [boardcastType, setBoardcastType] = useState<BoardcastType | null>(data?.boardcastType ?? null)
    const [episodeDuration, setEpisodeDuration] = useState<number | null>(data?.episodeDuration ?? 24)
    const [episodeTotalNum, setEpisodeTotalNum] = useState<number>(data?.episodeTotalNum ?? 12)
    const [episodePublishedNum, setEpisodePublishedNum] = useState<number>(data?.episodePublishedNum ?? 0)
    const [episodePublishPlan, setEpisodePublishPlan] = useState<EpisodePublishRecord[]>(data?.episodePublishPlan ?? [])
    const [relations, setRelations] = useState<Partial<ProjectRelationType>>(data?.relations ?? {})
    
    const breadcrumb = {
        url: "/anime/database",
        detail: data?.title ?? "新建",
        detailIcon: <RiFileAddLine/>
    }

    const tabs = [
        {label: "基本信息", icon: <PiInfoBold/>, content: <BasicInfoTab 
            title={title} subtitles={subtitles} description={description} keywords={keywords} tags={tags} 
            ratingS={ratingS} ratingV={ratingV} region={region} publishTime={publishTime}
            setTitle={setTitle} setSubtitles={setSubtitles} setDescription={setDescription} setKeywords={setKeywords} setTags={setTags} 
            setRatingS={setRatingS} setRatingV={setRatingV} setRegion={setRegion} setPublishTime={setPublishTime}
        />},
        {label: "动画信息", icon: <RiTvLine/>, content: <AnimeInfoTab
            originalType={originalType} boardcastType={boardcastType} episodePublishPlan={episodePublishPlan}
            episodeDuration={episodeDuration} episodeTotalNum={episodeTotalNum} episodePublishedNum={episodePublishedNum}
            setOriginalType={setOriginalType} setBoardcastType={setBoardcastType} setEpisodePublishPlan={setEpisodePublishPlan}
            setEpisodeDuration={setEpisodeDuration} setEpisodeTotalNum={setEpisodeTotalNum} setEpisodePublishedNum={setEpisodePublishedNum} 
        />},
        {label: "STAFF", icon: <PiUserBold/>, content: <StaffTab staffs={staffs} setStaffs={setStaffs}/>},
        {label: "关联", icon: <RiLink/>, content: <RelationTab projectType={ProjectType.ANIME} relations={relations} setRelations={setRelations}/>},
    ]

    const onSave = () => {
        const finalRelations: Partial<ProjectRelationModel> = Object.fromEntries(Object.entries(relations).map(([key, value]) => [key, value.map(r => r.id)]))
        onSubmit?.({
            title, subtitles, description, keywords, 
            ratingS, ratingV, region, tags, staffs, publishTime,
            originalType, boardcastType,
            episodeDuration, episodeTotalNum, episodePublishedNum, episodePublishPlan,
            relations: finalRelations
        })
    }

    const onCancel = () => {
        router.back()
    }

    return (
        <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onCancel={onCancel} onDelete={onDelete}/>
    )    
}

interface BasicInfoTabProps {
    title: string
    subtitles: string[]
    description: string
    keywords: string[]
    tags: string[]
    ratingS: RatingSex | null
    ratingV: RatingViolence | null
    region: Region | null
    publishTime: string | null
    
    setTitle: (title: string) => void
    setSubtitles: (subtitles: string[]) => void
    setDescription: (description: string) => void
    setKeywords: (keywords: string[]) => void
    setTags: (tags: string[]) => void
    setRatingS: (ratingSex: RatingSex | null) => void
    setRatingV: (ratingViolence: RatingViolence | null) => void
    setRegion: (region: Region | null) => void
    setPublishTime: (publishTime: string | null) => void
}

const BasicInfoTab = memo(function BasicInfoTab(props: BasicInfoTabProps) {
    const search = useCallback(async (text: string): Promise<string[]> => {
        const tags = await listTags({search: text, type: "ANIME"})
        return tags.map(t => t.name)
    }, [])

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
                        发布时间
                    </Field.Label>
                    <DateTimePicker mode="month" value={props.publishTime} onValueChange={props.setPublishTime}/>
                </Field.Root>
            </Flex>
        </Flex>
    )
})

interface StaffTabProps {
    staffs: {type: string, members: string[]}[]
    setStaffs:(staffs: {type: string, members: string[]}[]) => void
}

const StaffTab = memo(function StaffTab(props: StaffTabProps) {
    const search = useCallback(async (text: string): Promise<string[]> => {
        const staffs = await listStaffs({search: text})
        return staffs.map(t => t.name)
    }, [])

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
                <Flex direction="column" flex="1" gap="1">
                    <Field.Root>
                        <Field.Label>
                            STAFF
                        </Field.Label>
                        <StaffEditor value={props.staffs} onValueChange={props.setStaffs} width="full" search={search}/>
                    </Field.Root>
                </Flex>
            </Flex>
        </Flex>
    )
})

interface AnimeInfoTabProps {
    originalType: OriginalType | null
    boardcastType: BoardcastType | null
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecord[]
    setOriginalType: (originalType: OriginalType | null) => void
    setBoardcastType: (boardcastType: BoardcastType | null) => void
    setEpisodeDuration: (episodeDuration: number | null) => void
    setEpisodeTotalNum: (episodeTotalNum: number) => void
    setEpisodePublishedNum: (episodePublishedNum: number) => void
    setEpisodePublishPlan: (episodePublishPlan: EpisodePublishRecord[]) => void
}

const AnimeInfoTab = memo(function AnimeInfoTab(props: AnimeInfoTabProps) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setEpisodeTotalNum = useCallback((value: number | null) => props.setEpisodeTotalNum(value ?? 0), [props.setEpisodeTotalNum])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setEpisodePublishedNum = useCallback((value: number | null) => props.setEpisodePublishedNum(value ?? 0), [props.setEpisodePublishedNum])

    return (
        <Flex direction="column" gap="1">
            <Flex gap="4">
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
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(33% - 8px)"}}>
                    <Field.Label>
                        单集时长
                    </Field.Label>
                    <NumberInput width="full" value={props.episodeDuration} onValueChange={props.setEpisodeDuration} min={0}/>
                </Field.Root>
            </Flex>
            <Flex gap="4">
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        总集数
                    </Field.Label>
                    <NumberInput width="full" value={props.episodeTotalNum} onValueChange={setEpisodeTotalNum} min={0}/>
                </Field.Root>
                <Field.Root flex={{base: "1 1 100%", sm: "1 1 calc(50% - 8px)"}}>
                    <Field.Label>
                        已发布集数
                    </Field.Label>
                    <NumberInput width="full" value={props.episodePublishedNum} onValueChange={setEpisodePublishedNum} min={0}/>
                </Field.Root>
            </Flex>
            <Field.Root>
                <Field.Label>
                    已发布集数
                </Field.Label>
                <EpisodePublishedRecordEditor value={props.episodePublishPlan} onValueChange={props.setEpisodePublishPlan}/>
            </Field.Root>
            <Field.Root>
                <Field.Label>
                    放送计划
                </Field.Label>
                {/* TODO: 放送计划编辑器 */}
            </Field.Root>
        </Flex>
    )
})

interface RelationTabProps {
    projectType: ProjectType
    relations: Partial<ProjectRelationType>
    setRelations: (relations: Partial<ProjectRelationType>) => void
}

const RelationTab = memo(function RelationTab(props: RelationTabProps) {
    const search = async (text: string) => {
        return await listProject({search: text, type: props.projectType})
    }

    return (
        <RelationEditor
            value={props.relations}
            onValueChange={props.setRelations}
            search={search}
        />
    )
})