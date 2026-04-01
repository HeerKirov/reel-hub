import { z } from "zod"
import { cache } from "react"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Prisma, Project } from "@/prisma/generated"
import { ProjectType, RATING_SEX_TO_INDEX, RATING_VIOLENCE_TO_INDEX } from "@/constants/project"
import { exceptionNotFound, exceptionParamError } from "@/constants/exception"
import { safeExecute } from "@/helpers/execution"
import { getPublishTimeRange } from "@/helpers/data"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { ProjectCommonForm, ProjectListFilter, ProjectRelationModel, ProjectRelationSchema } from "@/schemas/project"
import { CreateProjectError, DeleteProjectError, ListProjectError, UpdateProjectError } from "@/schemas/error"
import { getRelations, removeProjectInTopology, updateRelations } from "./project-relation"
import { saveTags, saveStaffs } from "./project-utils"

type ProjectRowWithStaffsAndTags = Prisma.ProjectGetPayload<{ include: { staffs: { include: { staff: true } }; tags: { include: { tag: true } } } }>

type ProjectKindTiming = { userId: string; now: Date }

type ProjectAfterUpdateContext<TForm> = { id: string; before: Project; v: TForm; now: Date }

export type ProjectCrudKind<TListFilter extends ProjectListFilter = ProjectListFilter, TForm extends ProjectCommonForm = ProjectCommonForm, TListItem = unknown, TDetail = unknown> = {
    type: ProjectType
    listFilterSchema: z.ZodType<TListFilter>
    formSchema: z.ZodType<TForm>
    listExtraWhere: (data: TListFilter) => Prisma.ProjectWhereInput
    toListItem: (row: Project) => TListItem
    toDetail: (row: ProjectRowWithStaffsAndTags, relations: ProjectRelationSchema, relationsTopology: ProjectRelationSchema) => TDetail
    buildCreateExtras: (v: TForm, ctx: ProjectKindTiming) => Partial<Prisma.ProjectCreateInput>
    buildUpdateExtras: (v: TForm, ctx: ProjectKindTiming) => Partial<Prisma.ProjectUpdateInput>
    normalizeFormForCreate?: (v: TForm, now: Date) => void | Promise<void>
    normalizeFormForUpdate?: (v: TForm, existing: Project, now: Date) => void | Promise<void>
    afterProjectUpdate?: (ctx: ProjectAfterUpdateContext<TForm>) => void | Promise<void>
}

function runListForKind<TListFilter extends ProjectListFilter, TForm extends ProjectCommonForm, TListItem, TDetail, E>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>) {
    return async (filter: unknown): Promise<Result<ListResult<TListItem>, E>> => {
        return safeExecute(async () => {
            const validate = kind.listFilterSchema.safeParse(filter)
            if(!validate.success) return err(exceptionParamError(validate.error.message))

            const data = validate.data
            const extra = kind.listExtraWhere(data)

            const where: Prisma.ProjectWhereInput = {
                ...extra,
                type: kind.type,
                OR: data.search ? [
                    { title: { contains: data.search } },
                    { subtitles: { contains: data.search } },
                    { keywords: { contains: data.search } }
                ] : undefined,
                ratingS: data.ratingS !== undefined ? RATING_SEX_TO_INDEX[data.ratingS] : undefined,
                ratingV: data.ratingV !== undefined ? RATING_VIOLENCE_TO_INDEX[data.ratingV] : undefined,
                publishTime: data.publishTime !== undefined ? getPublishTimeRange(data.publishTime) : undefined,
                tags: data.tag ? { some: { tag: { name: data.tag } } } : undefined,
                staffs: data.staff ? { some: { staff: { name: data.staff } } } : undefined
            }

            const p = data.page ?? 1
            const s = data.size ?? 15
            const [list, total] = await Promise.all([
                prisma.project.findMany({
                    where,
                    orderBy: { publishTime: "desc" },
                    skip: (p - 1) * s,
                    take: s
                }),
                prisma.project.count({ where })
            ])

            return ok({ list: list.map(kind.toListItem), total })
        }) as Promise<Result<ListResult<TListItem>, E>>
    }
}

function runCreateForKind<TListFilter extends ProjectListFilter, TForm extends ProjectCommonForm, TListItem, TDetail, E>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>) {
    return async (form: unknown): Promise<Result<string, E>> => {
        return safeExecute(async () => {
            await requireAccess("project", "write")
            const userId = await getUserId()
            const now = new Date()

            const validate = kind.formSchema.safeParse(form)
            if(!validate.success) return err(exceptionParamError(validate.error.message))

            await kind.normalizeFormForCreate?.(validate.data, now)
            
            const common = validate.data
            const r = await prisma.project.create({
                data: {
                    title: common.title ?? "",
                    subtitles: common.subtitles?.join("|") ?? "",
                    description: common.description || "",
                    keywords: common.keywords?.join("|") ?? "",
                    type: kind.type,
                    publishTime: common.publishTime ?? null,
                    ratingS: common.ratingS !== undefined && common.ratingS !== null ? RATING_SEX_TO_INDEX[common.ratingS] : null,
                    ratingV: common.ratingV !== undefined && common.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[common.ratingV] : null,
                    region: common.region ?? null,
                    relations: {},
                    relationsTopology: {},
                    resources: {},
                    createTime: now,
                    updateTime: now,
                    creator: userId,
                    updator: userId,
                    ...kind.buildCreateExtras(validate.data, { userId, now })
                }
            })

            if(validate.data.tags !== undefined) {
                const tagResult = await saveTags(r.id, kind.type, validate.data.tags)
                if(!tagResult.ok) return err(tagResult.err)
            }
            if(validate.data.staffs !== undefined) {
                const staffResult = await saveStaffs(r.id, validate.data.staffs)
                if(!staffResult.ok) return err(staffResult.err)
            }
            if(validate.data.relations !== undefined) {
                const relationResult = await updateRelations(r.id, validate.data.relations)
                if(!relationResult.ok) return err(relationResult.err)
            }

            return ok(r.id)
        }) as Promise<Result<string, E>>
    }
}

function runUpdateForKind<TListFilter extends ProjectListFilter, TForm extends ProjectCommonForm, TListItem, TDetail, E>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>) {
    return async (id: string, form: unknown): Promise<Result<void, E>> => {
        return safeExecute(async () => {
            await requireAccess("project", "write")
            const userId = await getUserId()
            const now = new Date()

            const validate = kind.formSchema.safeParse(form)
            if(!validate.success) return err(exceptionParamError(validate.error.message))
            
            const record = await prisma.project.findUnique({ where: { id } })
            if(!record || record.type !== kind.type) return err(exceptionNotFound("Project not found"))
            
            await kind.normalizeFormForUpdate?.(validate.data, record, now)
            
            const common = validate.data
            await prisma.project.update({
                where: { id },
                data: {
                    title: common.title,
                    subtitles: common.subtitles?.join("|") ?? "",
                    description: common.description,
                    keywords: common.keywords?.join("|") ?? "",
                    publishTime: common.publishTime,
                    ratingS: common.ratingS !== undefined && common.ratingS !== null ? RATING_SEX_TO_INDEX[common.ratingS] : null,
                    ratingV: common.ratingV !== undefined && common.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[common.ratingV] : null,
                    region: common.region,
                    updateTime: now,
                    updator: userId,
                    ...kind.buildUpdateExtras(validate.data, { userId, now })
                }
            })

            if(validate.data.tags !== undefined) {
                const tagResult = await saveTags(id, kind.type, validate.data.tags)
                if(!tagResult.ok) return err(tagResult.err)
            }
            if(validate.data.staffs !== undefined) {
                const staffResult = await saveStaffs(id, validate.data.staffs)
                if(!staffResult.ok) return err(staffResult.err)
            }
            if(validate.data.relations !== undefined) {
                const relationResult = await updateRelations(id, validate.data.relations)
                if(!relationResult.ok) return err(relationResult.err)
            }

            await kind.afterProjectUpdate?.({ id, before: record, v: validate.data, now })
            
            return ok(undefined)
        }) as Promise<Result<void, E>>
    }
}

function runDeleteForKind<TListFilter extends ProjectListFilter, TForm extends ProjectCommonForm, TListItem, TDetail, E>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>) {
    return async (id: string): Promise<Result<void, E>> => {
        return safeExecute(async () => {
            await requireAccess("project", "write")

            const r = await prisma.project.findUnique({ where: { id } })
            if(!r || r.type !== kind.type) return err(exceptionNotFound("Project not found"))

            if(Object.keys(r.relationsTopology as ProjectRelationModel).length > 0) {
                const removeResult = await removeProjectInTopology(id, r.relationsTopology as ProjectRelationModel)
                if(!removeResult.ok) return err(removeResult.err)
            }

            await prisma.project.delete({ where: { id } })
            await prisma.projectStaffRelation.deleteMany({ where: { projectId: id } })
            await prisma.projectTagRelation.deleteMany({ where: { projectId: id } })
            await prisma.record.deleteMany({ where: { projectId: id } })
            await prisma.recordProgress.deleteMany({ where: { projectId: id } })
            await prisma.purchase.deleteMany({ where: { projectId: id } })
            await prisma.comment.deleteMany({ where: { projectId: id } })
            return ok(undefined)
        }) as Promise<Result<void, E>>
    }
}

function runRetrieveCachedForKind<TListFilter extends ProjectListFilter, TForm extends ProjectCommonForm, TListItem, TDetail>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>) {
    return cache(async (id: string): Promise<TDetail | null> => {
        const row = await prisma.project.findUnique({
            where: { id },
            include: {
                staffs: { include: { staff: true } },
                tags: { include: { tag: true } }
            }
        })
        if(!row || row.type !== kind.type) return null
        const { relations, relationsTopology } = await getRelations(
            row.relations as ProjectRelationModel,
            row.relationsTopology as ProjectRelationModel
        )
        return kind.toDetail(row as ProjectRowWithStaffsAndTags, relations, relationsTopology)
    })
}

export type ProjectCrudApi<
    TListFilter extends ProjectListFilter,
    TForm extends ProjectCommonForm,
    TListItem,
    TDetail,
    EList = ListProjectError,
    ECreate = CreateProjectError,
    EUpdate = UpdateProjectError,
    EDelete = DeleteProjectError
> = {
    list: (filter: TListFilter) => Promise<Result<ListResult<TListItem>, EList>>
    retrieve: (id: string) => Promise<TDetail | null>
    create: (form: TForm) => Promise<Result<string, ECreate>>
    update: (id: string, form: TForm) => Promise<Result<void, EUpdate>>
    delete: (id: string) => Promise<Result<void, EDelete>>
}

export function createProjectCrudApi<
    TListFilter extends ProjectListFilter,
    TForm extends ProjectCommonForm,
    TListItem,
    TDetail,
    EList = ListProjectError,
    ECreate = CreateProjectError,
    EUpdate = UpdateProjectError,
    EDelete = DeleteProjectError
>(kind: ProjectCrudKind<TListFilter, TForm, TListItem, TDetail>): ProjectCrudApi<TListFilter, TForm, TListItem, TDetail, EList, ECreate, EUpdate, EDelete> {    
    return {
        list: runListForKind<TListFilter, TForm, TListItem, TDetail, EList>(kind),
        retrieve: runRetrieveCachedForKind<TListFilter, TForm, TListItem, TDetail>(kind),
        create: runCreateForKind<TListFilter, TForm, TListItem, TDetail, ECreate>(kind),
        update: runUpdateForKind<TListFilter, TForm, TListItem, TDetail, EUpdate>(kind),
        delete: runDeleteForKind<TListFilter, TForm, TListItem, TDetail, EDelete>(kind)
    }
}
