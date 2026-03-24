"use server"
import { CommentListFilter, commentListFilter, CommentSchema, CommentUpsertSchema, commentUpsertSchema, parseCommentSchema, CommentWithProjectSchema, parseCommentWithProjectSchema } from "@/schemas/comment"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { exceptionParamError, exceptionResourceNotExist, safeExecuteResult } from "@/constants/exception"
import { err, ok, Result } from "@/schemas/all"
import { CountCommentsError, DeleteCommentError, ListCommentsError, RetrieveCommentError, UpsertCommentError } from "@/schemas/error"

export async function listComments(filter: CommentListFilter): Promise<Result<CommentWithProjectSchema[], ListCommentsError>> {
    return safeExecuteResult(async () => {
        await requireAccess("comment", "read")
        const validate = commentListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

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
                [filter.orderBy ?? "updateTime"]: "desc"
            },
            skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
            take: validate.data.size ?? 15,
            include: {
                project: {select: {id: true, type: true, title: true, resources: true}}
            }
        })

        return ok(r.map(parseCommentWithProjectSchema))
    })
}

export async function countComments(filter: CommentListFilter): Promise<Result<number, CountCommentsError>> {
    return safeExecuteResult(async () => {
        await requireAccess("comment", "read")
        const validate = commentListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))
            
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

        return ok(r)
    })
}

export async function retrieveComment(projectId: string): Promise<Result<CommentSchema | null, RetrieveCommentError>> {
    return safeExecuteResult(async () => {
        await requireAccess("comment", "read")
        const userId = await getUserId()

        const r = await prisma.comment.findUnique({
            where: {ownerId_projectId: {ownerId: userId, projectId}}
        })

        return ok(r ? parseCommentSchema(r) : null)
    })
}

export async function upsertComment(projectId: string, form: CommentUpsertSchema): Promise<Result<void, UpsertCommentError>> {
    return safeExecuteResult(async () => {
        await requireAccess("comment", "write")
        const userId = await getUserId()
        const now = new Date()
        
        const validate = commentUpsertSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionResourceNotExist("projectId", projectId))

        await prisma.comment.upsert({
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

        return ok(undefined)
    })
}

export async function deleteComment(projectId: string): Promise<Result<void, DeleteCommentError>> {
    return safeExecuteResult(async () => {
        await requireAccess("comment", "write")
        const userId = await getUserId()
        await prisma.comment.delete({
            where: {
                ownerId_projectId: {ownerId: userId, projectId}
            }
        })
        return ok(undefined)
    })
}