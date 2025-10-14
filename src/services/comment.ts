"use server"
import { CommentListFilter, commentListFilter, CommentSchema, CommentUpsertSchema, commentUpsertSchema, parseCommentSchema, CommentWithProjectSchema, parseCommentWithProjectSchema } from "@/schemas/comment"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"

export async function listComments(filter: CommentListFilter): Promise<CommentWithProjectSchema[]> {
    const validate = commentListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)

    const userId = await getUserId()

    const r = await prisma.comment.findMany({
        where: {
            ownerId: userId,
            project: validate.data.search ? {
                OR: [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ]
            } : undefined
        },
        orderBy: {
            updateTime: "desc"
        },
        skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
        take: validate.data.size ?? 15,
        include: {
            project: {
                select: {
                    id: true,
                    title: true,
                    resources: true
                }
            }
        }
    })

    return r.map(parseCommentWithProjectSchema)
}

export async function countComments(filter: CommentListFilter): Promise<number> {
    const validate = commentListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)
        
    const userId = await getUserId()
    
    const r = await prisma.comment.count({
        where: {
            ownerId: userId,
            project: validate.data.search ? {
                OR: [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ]
            } : undefined
        }
    })

    return r
}

export async function retrieveComment(projectId: string): Promise<CommentSchema | null> {
    const userId = await getUserId()

    const r = await prisma.comment.findUnique({
        where: {ownerId_projectId: {ownerId: userId, projectId}}
    })

    return r ? parseCommentSchema(r) : null
}

export async function upsertComment(projectId: string, form: CommentUpsertSchema): Promise<void> {
    const userId = await getUserId()
    const now = new Date()
    
    const validate = commentUpsertSchema.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const r = await prisma.comment.upsert({
        where: {
            ownerId_projectId: {ownerId: userId, projectId}
        },
        create: {
            ...validate.data,
            createTime: now,
            updateTime: now,
            ownerId: userId,
            projectId
        },
        update: {
            ...validate.data,
            updateTime: now
        }
    })
}

export async function deleteComment(projectId: string): Promise<void> {
    const userId = await getUserId()

    const r = await prisma.comment.delete({
        where: {
            ownerId_projectId: {ownerId: userId, projectId}
        }
    })
}