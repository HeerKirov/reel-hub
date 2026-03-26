"use server"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { prisma } from "@/lib/prisma"
import { exceptionAlreadyExists, exceptionNotFound, exceptionParamError, safeExecuteResult } from "@/constants/exception"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { CreateTagError, DeleteTagError, ListTagsError, UpdateTagError } from "@/schemas/error"
import { TagCreateFormSchema, TagListFilter, tagCreateFormSchema, TagSchema, tagListFilter, tagUpdateFormSchema, TagUpdateFormSchema, parseTagSchema } from "@/schemas/tag"

export async function listTags(filter: TagListFilter): Promise<Result<ListResult<TagSchema>, ListTagsError>> {
    return safeExecuteResult(async () => {
        const validate = tagListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where = {
            type: validate.data.type,
            name: validate.data.search ? {contains: validate.data.search} : undefined
        }
        const [r, total] = await Promise.all([
            prisma.tag.findMany({
                where,
                orderBy: {
                    createTime: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.tag.count({ where })
        ])

        return ok({
            list: r.map(parseTagSchema),
            total
        })
    })
}

export async function createTag(form: TagCreateFormSchema): Promise<Result<TagSchema, CreateTagError>> {
    return safeExecuteResult(async () => {
        await requireAccess("tag", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = tagCreateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const exists = await prisma.tag.findFirst({
            where: {
                type: validate.data.type,
                name: validate.data.name
            }
        })
        if(exists) return err(exceptionAlreadyExists("tag", "name", validate.data.name))
        
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

export async function updateTag(id: number, form: TagUpdateFormSchema): Promise<Result<void, UpdateTagError>> {
    return safeExecuteResult(async () => {
        await requireAccess("tag", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = tagUpdateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const source = await prisma.tag.findUnique({ where: { id } })
        if(!source) return err(exceptionNotFound("Tag not found"))

        if(validate.data.name) {
            const exists = await prisma.tag.findFirst({
                where: {
                    id: { not: id },
                    type: source.type,
                    name: validate.data.name
                }
            })
            if (exists) return err(exceptionAlreadyExists("tag", "name", validate.data.name))
        }

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

export async function deleteTag(id: number): Promise<Result<void, DeleteTagError>> {
    return safeExecuteResult(async () => {
        await requireAccess("tag", "write")

        const self = await prisma.tag.findUnique({ where: { id } })
        if(!self) return err(exceptionNotFound("Tag not found"))

        await prisma.projectTagRelation.deleteMany({where: {tagId: id}})
        await prisma.tag.delete({where: { id }})
        return ok(undefined)
    })
}
