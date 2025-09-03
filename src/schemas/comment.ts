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
    size: z.number().optional()
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

export const parseCommentSchema = (data: Comment): CommentSchema => {
    return commentSchema.parse(data)
}

export type CommentModel = z.infer<typeof commentModel>
export type CommentListFilter = z.infer<typeof commentListFilter>
export type CommentUpsertSchema = z.infer<typeof commentUpsertSchema>
export type CommentSchema = z.infer<typeof commentSchema>