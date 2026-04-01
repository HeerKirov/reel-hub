"use client"
import { memo, useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { RiFileAddLine, RiLink } from "react-icons/ri"
import { PiGenderIntersexBold, PiInfoBold, PiKnifeFill, PiUserBold } from "react-icons/pi"
import { Field, Flex, Icon, Textarea } from "@chakra-ui/react"
import { Select, Input, DateTimePicker } from "@/components/form"
import { TagEditor, DynamicInputList, RatingEditor, StaffEditor, RelationEditor } from "@/components/editor"
import { EditorWithTabLayout } from "@/components/layout"
import { Result } from "@/schemas/all"
import { ProjectCommonForm, ProjectDetailSchema, ProjectRelationModel, ProjectRelationSchema } from "@/schemas/project"
import { CreateProjectError, DeleteProjectError, UpdateProjectError } from "@/schemas/error"
import { RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, RatingSex, RatingViolence, Region, REGION_ITEMS, ProjectType } from "@/constants/project"
import { listTags } from "@/services/tag"
import { listStaffs } from "@/services/staff"
import { findProject } from "@/services/project"
import { unwrapQueryResult } from "@/helpers/result"
import { handleActionResult } from "@/helpers/action"

const CropperImage = dynamic(() => import("@/components/cropper").then(mod => mod.CropperFileUploader), { ssr: false })

export interface ProjectCreateEditorProps<FORM extends ProjectCommonForm, ECreate extends CreateProjectError, EXTRA = undefined> {
    type: ProjectType
    create: (form: FORM) => Promise<Result<string, ECreate>>
    defaultExtra?: EXTRA extends undefined ? undefined : () => EXTRA
    extraToForm?: EXTRA extends undefined ? undefined : (extra: EXTRA) => Partial<FORM>
    tabs?: {label: string, icon: React.ReactNode, content: (props: {extra: EXTRA, setExtra: (field: keyof EXTRA, value: EXTRA[keyof EXTRA]) => void}) => React.ReactNode}[]
}

export interface ProjectUpdateEditorProps<RES extends ProjectDetailSchema, FORM extends ProjectCommonForm, EUpdate extends UpdateProjectError, EXTRA = undefined> {
    data: RES
    type: ProjectType
    update: (id: string, form: FORM) => Promise<Result<void, EUpdate>>
    delete: (id: string) => Promise<Result<void, DeleteProjectError>>
    dataToExtra?: EXTRA extends undefined ? undefined : (data: RES) => EXTRA
    extraToForm?: EXTRA extends undefined ? undefined : (extra: EXTRA) => Partial<FORM>
    tabs?: {label: string, icon: React.ReactNode, content: (props: {extra: EXTRA, setExtra: (field: keyof EXTRA, value: EXTRA[keyof EXTRA]) => void}) => React.ReactNode}[]
}

export interface ProjectEditorProps<RES extends ProjectDetailSchema, FORM extends ProjectCommonForm, EXTRA = undefined> {
    data?: RES
    type: ProjectType
    dataToExtra?: EXTRA extends undefined ? undefined : (data: RES | undefined) => EXTRA
    extraToForm?: EXTRA extends undefined ? undefined : (extra: EXTRA) => Partial<FORM>
    onSubmit?: (form: FORM, resources?: Record<string, Blob>) => Promise<void>
    onDelete?: () => Promise<void>
    onCancel?: () => void
    tabs?: {label: string, icon: React.ReactNode, content: (props: {extra: EXTRA, setExtra: (field: keyof EXTRA, value: EXTRA[keyof EXTRA]) => void}) => React.ReactNode}[]
}

export function ProjectCreateEditor<FORM extends ProjectCommonForm, ECreate extends CreateProjectError, EXTRA = undefined>({ type, create, defaultExtra, extraToForm, tabs }: ProjectCreateEditorProps<FORM, ECreate, EXTRA>) {
    const router = useRouter()

    const onSubmit = async (form: FORM, resources?: Record<string, Blob>) => {
        const result = handleActionResult(await create(form), { successTitle: "项目已创建" })
        if(!result.ok) return
        const id = result.value
        if(resources !== undefined) {
            const form = new FormData()
            form.append("projectId", id)
            if(resources["cover"]) form.append("cover", resources["cover"])
            if(resources["avatar"]) form.append("avatar", resources["avatar"])
            await fetch("/api/resources", {method: "POST", body: form})
        }
        router.replace(`/${type.toLowerCase()}/database/${id}`)
    }
    return <ProjectEditor data={undefined} type={type} dataToExtra={defaultExtra} extraToForm={extraToForm} onSubmit={onSubmit} tabs={tabs}/>
}

export function ProjectUpdateEditor<RES extends ProjectDetailSchema, FORM extends ProjectCommonForm, EUpdate extends UpdateProjectError, EXTRA = undefined>({ data, type, update, delete: deleteProject, dataToExtra, extraToForm, tabs }: ProjectUpdateEditorProps<RES, FORM, EUpdate, EXTRA>) {
    const router = useRouter()

    const onSubmit = async (form: FORM, resources?: Record<string, Blob>) => {
        const result = handleActionResult(await update(data.id, form), { successTitle: "项目已保存" })
        if(!result.ok) return
        if(resources !== undefined) {
            const form = new FormData()
            form.append("projectId", data.id)
            if(resources["cover"]) form.append("cover", resources["cover"])
            if(resources["avatar"]) form.append("avatar", resources["avatar"])
            await fetch("/api/resources", {method: "POST", body: form})
        }
        router.replace(`/${type.toLowerCase()}/database/${data.id}`)
    }

    const onDelete = async () => {
        const result = handleActionResult(await deleteProject(data.id), { successTitle: "项目已删除" })
        if(!result.ok) return
        router.replace(`/${type.toLowerCase()}/database`)
    }

    const onCancel = () => {
        router.replace(`/${type.toLowerCase()}/database/${data.id}`)
    }

    return <ProjectEditor data={data} type={type} dataToExtra={dataToExtra as any} extraToForm={extraToForm} onSubmit={onSubmit} onDelete={onDelete} onCancel={onCancel} tabs={tabs}/>
}

function ProjectEditor<RES extends ProjectDetailSchema, FORM extends ProjectCommonForm, EXTRA = undefined>({ data, type, dataToExtra, extraToForm, onSubmit, onDelete, onCancel, tabs: extraTabs }: ProjectEditorProps<RES, FORM, EXTRA>) {
    const [title, setTitle] = useState<string>(data?.title ?? "")
    const [subtitles, setSubtitles] = useState<string[]>(data?.subtitles ?? [])
    const [description, setDescription] = useState<string>(data?.description ?? "")
    const [keywords, setKeywords] = useState<string[]>(data?.keywords ?? [])
    const [tags, setTags] = useState<string[]>(data?.tags.map(t => t.name) ?? [])
    const [staffs, setStaffs] = useState<{type: string, members: string[]}[]>(data?.staffs.map(s => ({type: s.type, members: s.members.map(m => m.name)})) ?? [])
    const [ratingS, setRatingS] = useState<RatingSex | null>(data?.ratingS ?? null)
    const [ratingV, setRatingV] = useState<RatingViolence | null>(data?.ratingV ?? null)
    const [region, setRegion] = useState<Region | null>(data?.region ?? (type === ProjectType.ANIME ? "jp" : type === ProjectType.MOVIE ? "us" : null))
    const [publishTime, setPublishTime] = useState<string | null>(data?.publishTime ?? null)
    const [relations, setRelations] = useState<Partial<ProjectRelationSchema>>(data?.relations ?? {})
    const [resourceCover, setResourceCover] = useState<string | Blob | null>(data?.resources?.["cover"] ?? null)
    const [resourceAvatar, setResourceAvatar] = useState<string | Blob | null>(data?.resources?.["avatar"] ?? null)
    const [extra, setExtra] = useState<EXTRA>(() => dataToExtra?.(data) ?? (undefined as EXTRA))

    const setExtraField = useCallback((field: keyof EXTRA, value: EXTRA[keyof EXTRA]) => {
        setExtra(prev => ({...prev, [field]: value}))
    }, [])

    const onSave = async () => {
        const finalRelations: Partial<ProjectRelationModel> = Object.fromEntries(Object.entries(relations).map(([key, value]) => [key, value.map(r => r.id)]))
        const resources: Record<string, Blob> = {}
        if(resourceAvatar instanceof Blob) resources["avatar"] = resourceAvatar
        if(resourceCover instanceof Blob) resources["cover"] = resourceCover
        await onSubmit?.({
            title, subtitles, description, keywords, publishTime, 
            ratingS, ratingV, region, tags, staffs, relations: finalRelations as Record<string, string[]>,
            ...(extraToForm?.(extra) ?? {}) as any
        }, Object.keys(resources).length > 0 ? resources : undefined)
    }

    const breadcrumb = {
        url: `/${type.toLowerCase()}/database`,
        detail: data?.title ?? "新建",
        detailIcon: <RiFileAddLine/>
    }

    const tabs = [
        {label: "基本信息", icon: <PiInfoBold/>, content: <BasicInfoTab 
            type={type} title={title} subtitles={subtitles} description={description} keywords={keywords} tags={tags} 
            ratingS={ratingS} ratingV={ratingV} region={region} publishTime={publishTime}
            resourceCover={resourceCover} resourceAvatar={resourceAvatar} setResourceCover={setResourceCover} setResourceAvatar={setResourceAvatar}
            setTitle={setTitle} setSubtitles={setSubtitles} setDescription={setDescription} setKeywords={setKeywords} setTags={setTags} 
            setRatingS={setRatingS} setRatingV={setRatingV} setRegion={setRegion} setPublishTime={setPublishTime}
        />},
        ...(extraTabs?.map(tab => ({label: tab.label, icon: tab.icon, content: <tab.content extra={extra} setExtra={setExtraField}/>})) ?? []),
        {label: "STAFF", icon: <PiUserBold/>, content: <StaffTab type={type} staffs={staffs} setStaffs={setStaffs}/>},
        {label: "关联", icon: <RiLink/>, content: <RelationTab type={type} relations={relations} setRelations={setRelations}/>},
    ]    

    return (
        <EditorWithTabLayout breadcrumb={breadcrumb} tabs={tabs} onSave={onSave} onCancel={onCancel} onDelete={onDelete} deleteOptions={{confirmation: "确认要删除当前项目吗？此操作无法恢复。", countdown: 3}}/>
    )    
}

interface BasicInfoTabProps {
    type: ProjectType
    title: string
    subtitles: string[]
    description: string
    keywords: string[]
    tags: string[]
    ratingS: RatingSex | null
    ratingV: RatingViolence | null
    region: Region | null
    publishTime: string | null
    resourceCover: string | Blob | null
    resourceAvatar: string | Blob | null
    setResourceCover: (resourceCover: string | Blob | null) => void
    setResourceAvatar: (resourceAvatar: string | Blob | null) => void
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
        const tagsResult = await listTags({search: text, type: props.type})
        const { data, error } = unwrapQueryResult(tagsResult)
        return error ? [] : data.list.map(t => t.name)
    }, [])

    return (
        <Flex direction="column" gap="1">
            <Flex direction={{base: "column", sm: "row"}} gap="4">
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
                <Field.Root flex="1">
                    <Field.Label>头像与封面</Field.Label>
                    <Flex direction="row" gap="4">
                        <CropperImage flex="1" src={props.resourceAvatar ?? props.resourceCover} onCropChange={props.setResourceAvatar} aspectRatio={1}/>
                        <CropperImage flex="1" src={props.resourceCover ?? props.resourceAvatar} onCropChange={props.setResourceCover} aspectRatio={5/7}/>
                    </Flex>
                </Field.Root>
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
    type: ProjectType
    staffs: {type: string, members: string[]}[]
    setStaffs:(staffs: {type: string, members: string[]}[]) => void
}

const StaffTab = memo(function StaffTab(props: StaffTabProps) {
    const search = useCallback(async (text: string): Promise<string[]> => {
        const staffsResult = await listStaffs({search: text})
        const { data, error } = unwrapQueryResult(staffsResult)
        return error ? [] : data.list.map(t => t.name)
    }, [])

    return (
        <StaffEditor value={props.staffs} onValueChange={props.setStaffs} width="full" search={search} projectType={props.type}/>
    )
})

interface RelationTabProps {
    type: ProjectType
    relations: Partial<ProjectRelationSchema>
    setRelations: (relations: Partial<ProjectRelationSchema>) => void
}

const RelationTab = memo(function RelationTab(props: RelationTabProps) {
    const search = async (text: string) => {
        const projectsResult = await findProject({search: text, type: props.type})
        if(!projectsResult.ok) return []
        return projectsResult.value
    }

    return (
        <RelationEditor
            value={props.relations}
            onValueChange={props.setRelations}
            search={search}
        />
    )
})