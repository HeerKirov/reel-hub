import { z } from "zod"
import { Comment } from "@/prisma/generated"
import { PROJECT_TYPE } from "@/constants/project"

export const commentModel = z.object({
    id: z.number(),
    ownerId: z.string(),
    projectId: z.string(),
    score: z.number().nullable(),
    title: z.string().nullable(),
    article: z.string().nullable(),
    createTime: z.date(),
    updateTime: z.date()
})

export const commentListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional(),
    orderBy: z.enum(["updateTime", "score"]).optional()
})

export const commentUpsertSchema = z.object({
    score: z.number().nullable().optional(),
    title: z.string().nullable().optional(),
    article: z.string().nullable().optional()
})

export const commentSchema = commentUpsertSchema.extend({
    createTime: z.date(),
    updateTime: z.date()
})

export const commentWithProjectSchema = commentSchema.extend({
    project: z.object({
        id: z.string(),
        title: z.string(),
        resources: z.record(z.string(), z.string())
    })
})


export const parseCommentSchema = (data: Comment): CommentSchema => {
    return commentSchema.parse(data)
}

export const parseCommentWithProjectSchema = (data: Comment & { project: { id: string, title: string, resources: any } }): CommentWithProjectSchema => {
    const base = commentSchema.parse(data)
    return {
        ...base,
        project: {
            id: data.project.id,
            title: data.project.title,
            resources: (data.project.resources || {}) as Record<string, string>
        }
    }
}

export type CommentModel = z.infer<typeof commentModel>
export type CommentListFilter = z.infer<typeof commentListFilter>
export type CommentUpsertSchema = z.infer<typeof commentUpsertSchema>
export type CommentSchema = z.infer<typeof commentSchema>
export type CommentWithProjectSchema = z.infer<typeof commentWithProjectSchema>