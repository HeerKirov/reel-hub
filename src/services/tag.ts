"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { TagCreateFormSchema, TagListFilter, tagCreateFormSchema, TagSchema, tagListFilter, tagUpdateFormSchema, TagUpdateFormSchema, parseTagSchema } from "@/schemas/tag"

export async function listTags(filter: TagListFilter): Promise<TagSchema[]> {
    const validate = tagListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)

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

    return r.map(parseTagSchema)
}

export async function createTag(form: TagCreateFormSchema) {
    const userId = await getUserId()
    const now = new Date()

    const validate = tagCreateFormSchema.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)
    
    return await prisma.tag.create({
        data: {
            ...validate.data,
            createTime: now,
            updateTime: now,
            creator: userId,
            updator: userId
        }
    })
}

export async function retrieveTag(id: number): Promise<TagSchema | null> {
    const r = await prisma.tag.findUnique({
        where: { id }
    })
    if(!r) return null

    return parseTagSchema(r)
}

export async function updateTag(id: number, form: TagUpdateFormSchema) {
    const userId = await getUserId()
    const now = new Date()

    const validate = tagUpdateFormSchema.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const r = await prisma.tag.update({
        where: { id },
        data: {
            ...validate.data,
            updateTime: now,
            updator: userId
        }
    })
}

export async function deleteTag(id: number) {
    await prisma.tag.delete({where: { id }})
    await prisma.projectTagRelation.deleteMany({where: {tagId: id}})
}
