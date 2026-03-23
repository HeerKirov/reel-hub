"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { exceptionParamError, InternalServerError, ParamError, safeExecuteResult } from "@/constants/exception"
import { err, ok, Result } from "@/schemas/all"
import { TagCreateFormSchema, TagListFilter, tagCreateFormSchema, TagSchema, tagListFilter, tagUpdateFormSchema, TagUpdateFormSchema, parseTagSchema } from "@/schemas/tag"

type TagServiceError = ParamError | InternalServerError

export async function listTags(filter: TagListFilter): Promise<Result<TagSchema[], TagServiceError>> {
    return safeExecuteResult(async () => {
        const validate = tagListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const r = await prisma.tag.findMany({
            where: {
                type: validate.data.type,
                name: validate.data.search ? {contains: validate.data.search} : undefined
            },
            orderBy: {
                createTime: "desc"
            },
            skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
            take: validate.data.size ?? 15
        })

        return ok(r.map(parseTagSchema))
    })
}

export async function createTag(form: TagCreateFormSchema): Promise<Result<TagSchema, TagServiceError>> {
    return safeExecuteResult(async () => {
        const userId = await getUserId()
        const now = new Date()

        const validate = tagCreateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))
        
        const created = await prisma.tag.create({
            data: {
                ...validate.data,
                createTime: now,
                updateTime: now,
                creator: userId,
                updator: userId
            }
        })
        return ok(parseTagSchema(created))
    })
}

export async function retrieveTag(id: number): Promise<TagSchema | null> {
    const r = await prisma.tag.findUnique({
        where: { id }
    })
    if(!r) return null

    return parseTagSchema(r)
}

export async function updateTag(id: number, form: TagUpdateFormSchema): Promise<Result<void, TagServiceError>> {
    return safeExecuteResult(async () => {
        const userId = await getUserId()
        const now = new Date()

        const validate = tagUpdateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        await prisma.tag.update({
            where: { id },
            data: {
                ...validate.data,
                updateTime: now,
                updator: userId
            }
        })

        return ok(undefined)
    })
}

export async function deleteTag(id: number): Promise<Result<void, TagServiceError>> {
    return safeExecuteResult(async () => {
        await prisma.tag.delete({where: { id }})
        await prisma.projectTagRelation.deleteMany({where: {tagId: id}})
        return ok(undefined)
    })
}
