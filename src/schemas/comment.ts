import { z } from "zod"
import type { Comment, Project } from "@/prisma/generated"
import { PROJECT_TYPE } from "@/constants/project"
import { parseProjectSimpleSchema, type ProjectSimpleSchema } from "./project"

// =============================================================================
// Model
// =============================================================================

export interface CommentModel {
    id: number
    ownerId: string
    projectId: string
    score: number | null
    title: string | null
    article: string | null
    createTime: Date
    updateTime: Date
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export interface CommentSchema {
    score: number | null
    title: string | null
    article: string | null
    createTime: Date
    updateTime: Date
}

export type CommentWithProjectSchema = CommentSchema & { project: ProjectSimpleSchema }

// =============================================================================
// Filter
// =============================================================================

export const commentListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type CommentListFilter = z.infer<typeof commentListFilter>

export const completedUnscoredProjectsListFilter = z.object({
    page: z.number().optional(),
    size: z.number().optional()
})

export type CompletedUnscoredProjectsListFilter = z.infer<typeof completedUnscoredProjectsListFilter>

// =============================================================================
// Form
// =============================================================================

export const commentUpsertForm = z.object({
    score: z.number().nullable().optional(),
    title: z.string().nullable().optional(),
    article: z.string().nullable().optional()
})

export const commentUpsertSchema = commentUpsertForm

export type CommentUpsertForm = z.infer<typeof commentUpsertForm>

export type CommentUpsertSchema = CommentUpsertForm

// =============================================================================
// Parse
// =============================================================================

export function parseCommentSchema(data: Comment): CommentSchema {
    const m = data as CommentModel
    return {
        score: m.score,
        title: m.title,
        article: m.article,
        createTime: m.createTime,
        updateTime: m.updateTime
    }
}

export function parseCommentWithProjectSchema(
    data: Comment & { project: Pick<Project, "id" | "type" | "title" | "resources"> }
): CommentWithProjectSchema {
    return {
        ...parseCommentSchema(data),
        project: parseProjectSimpleSchema(data.project)
    }
}
