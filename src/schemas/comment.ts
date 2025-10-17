import { z } from "zod"
import { Comment, Project } from "@/prisma/generated"
import { PROJECT_TYPE } from "@/constants/project"
import { parseProjectSimpleSchema, projectSimpleSchema } from "./project"

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
    project: projectSimpleSchema
})


export const parseCommentSchema = (data: Comment): CommentSchema => {
    return commentSchema.parse(data)
}

export const parseCommentWithProjectSchema = (data: Comment & { project: Pick<Project, "id" | "title" | "resources"> }): CommentWithProjectSchema => {
    const base = commentSchema.parse(data)
    return {
        ...base,
        project: parseProjectSimpleSchema(data.project)
    }
}

export type CommentModel = z.infer<typeof commentModel>
export type CommentListFilter = z.infer<typeof commentListFilter>
export type CommentUpsertSchema = z.infer<typeof commentUpsertSchema>
export type CommentSchema = z.infer<typeof commentSchema>
export type CommentWithProjectSchema = z.infer<typeof commentWithProjectSchema>