"use server"
import { completedUnscoredProjectsListFilter, type CompletedUnscoredProjectsListFilter, CommentListFilter, commentListFilter, CommentSchema, CommentUpsertSchema, commentUpsertSchema, parseCommentSchema, CommentWithProjectSchema, parseCommentWithProjectSchema } from "@/schemas/comment"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { exceptionNotFound, exceptionParamError, InternalServerError, ParamError } from "@/constants/exception"
import { RecordStatus } from "@/constants/record"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { DeleteCommentError, ListCommentsError, RetrieveCommentError, UpsertCommentError } from "@/schemas/error"
import { parseProjectSimpleSchema, type ProjectSimpleSchema } from "@/schemas/project"

export async function listComments(filter: CommentListFilter): Promise<Result<ListResult<CommentWithProjectSchema>, ListCommentsError>> {
    return safeExecute(async () => {
        await requireAccess("comment", "read")
        const validate = commentListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const userId = await getUserId()
        const where = {
            ownerId: userId,
            project: {
                type: validate.data.type,
                OR: validate.data.search ? [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ] : undefined
            }
        }

        const [r, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                orderBy: {
                    [validate.data.orderBy ?? "updateTime"]: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15,
                include: {
                    project: {select: {id: true, type: true, title: true, resources: true}}
                }
            }),
            prisma.comment.count({ where })
        ])

        return ok({
            list: r.map(parseCommentWithProjectSchema),
            total
        })
    })
}

export async function retrieveComment(projectId: string): Promise<Result<CommentSchema | null, RetrieveCommentError>> {
    return safeExecute(async () => {
        await requireAccess("comment", "read")
        const userId = await getUserId()

        const r = await prisma.comment.findUnique({
            where: {ownerId_projectId: {ownerId: userId, projectId}}
        })

        return ok(r ? parseCommentSchema(r) : null)
    })
}

export async function upsertComment(projectId: string, form: CommentUpsertSchema): Promise<Result<void, UpsertCommentError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("comment", "write")
        const userId = await getUserId()
        const now = new Date()
        
        const validate = commentUpsertSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        await tx.comment.upsert({
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
    return safeExecuteTransaction(async tx => {
        await requireAccess("comment", "write")
        const userId = await getUserId()
        await tx.comment.delete({
            where: {
                ownerId_projectId: {ownerId: userId, projectId}
            }
        })
        return ok(undefined)
    })
}

export async function listCompletedUnscoredProjects(filter: CompletedUnscoredProjectsListFilter): Promise<Result<ListResult<ProjectSimpleSchema>, ParamError | InternalServerError>> {
    return safeExecute(async () => {
        await requireAccess("comment", "read")
        const userId = await getUserId()

        const validate = completedUnscoredProjectsListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const size = validate.data.size ?? 15
        const skip = (validate.data.page ?? 1 - 1) * size

        const where = {
            ownerId: userId,
            status: RecordStatus.COMPLETED,
            project: {
                comments: {
                    none: {
                        ownerId: userId
                    }
                }
            }
        }

        const [completedRecords, total] = await Promise.all([
            prisma.record.findMany({
                where,
                select: {
                    projectId: true
                },
                orderBy: {
                    lastActivityTime: "desc"
                },
                skip,
                take: size
            }),
            prisma.record.count({ where })
        ])

        if (completedRecords.length === 0) return ok({ list: [], total })

        const projectIds = completedRecords.map(r => r.projectId)
        const orderIndex = new Map(completedRecords.map((r, i) => [r.projectId, i] as const))

        const projects = await prisma.project.findMany({
            where: {
                id: { in: projectIds }
            },
            select: {
                id: true,
                type: true,
                title: true,
                resources: true
            }
        })

        projects.sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!)
        return ok({
            list: projects.map(parseProjectSimpleSchema),
            total
        })
    })
}