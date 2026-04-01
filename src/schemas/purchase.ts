import { z } from "zod"
import type { Purchase, PurchaseSummary, Project } from "@/prisma/generated"
import { ShoppingType } from "@/constants/purchase"
import { ONLINE_TYPE, PLATFORM } from "@/constants/game"
import { parseProjectSimpleSchema, type ProjectSimpleSchema } from "./project"

// =============================================================================
// Model
// =============================================================================

export interface PurchaseModel {
    id: string
    ownerId: string
    projectId: string
    purchaseType: ShoppingType
    description: string
    cost: number
    purchaseTime: Date
    createTime: Date
    updateTime: Date
}

export interface PurchaseSummaryModel {
    id: number
    ownerId: string
    projectId: string
    totalCost: number
    totalCount: number
    createTime: Date
    updateTime: Date
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export interface PurchaseSchema {
    id: string
    projectId: string
    purchaseType: ShoppingType
    description: string
    cost: number
    purchaseTime: Date
    createTime: Date
    updateTime: Date
}

export type PurchaseWithProjectSchema = PurchaseSchema & { project: ProjectSimpleSchema }

export interface PurchaseSummarySchema {
    projectId: string
    totalCost: number
    totalCount: number
    createTime: Date
    updateTime: Date
}

export type PurchaseSummaryWithProjectSchema = PurchaseSummarySchema & { project: ProjectSimpleSchema }

// =============================================================================
// Filter
// =============================================================================

export const SHOPPING_TYPE = [ShoppingType.MAIN, ShoppingType.DLC, ShoppingType.IN_APP_PURCHASE, ShoppingType.SUBSCRIPTION, ShoppingType.OTHER] as const

export const purchaseListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional(),
    orderBy: z.enum(["purchaseTime", "updateTime", "cost"]).optional(),
    purchaseType: z.enum(SHOPPING_TYPE).optional(),
    platform: z.enum(PLATFORM).optional(),
    onlineType: z.enum(ONLINE_TYPE).optional(),
    projectId: z.string().optional()
})

export const purchaseSummaryListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional(),
    orderBy: z.enum(["totalCost", "updateTime"]).optional(),
    platform: z.enum(PLATFORM).optional(),
    onlineType: z.enum(ONLINE_TYPE).optional(),
    projectId: z.string().optional()
})

export type PurchaseListFilter = z.infer<typeof purchaseListFilter>
export type PurchaseSummaryListFilter = z.infer<typeof purchaseSummaryListFilter>

// =============================================================================
// Form
// =============================================================================

export const purchaseCreateForm = z.object({
    projectId: z.string(),
    purchaseType: z.enum(SHOPPING_TYPE),
    description: z.string().optional().default(""),
    cost: z.number().min(0),
    purchaseTime: z.date()
})

export const purchaseUpdateForm = z.object({
    projectId: z.string().optional(),
    purchaseType: z.enum(SHOPPING_TYPE).optional(),
    description: z.string().optional(),
    cost: z.number().min(0).optional(),
    purchaseTime: z.date().optional()
})

export type PurchaseCreateForm = z.infer<typeof purchaseCreateForm>
export type PurchaseUpdateForm = z.infer<typeof purchaseUpdateForm>

// =============================================================================
// Parse
// =============================================================================

export function parsePurchaseSchema(data: Purchase): PurchaseSchema {
    const m = data as unknown as PurchaseModel
    return {
        id: m.id,
        projectId: m.projectId,
        purchaseType: m.purchaseType,
        description: m.description,
        cost: Number(m.cost),
        purchaseTime: m.purchaseTime,
        createTime: m.createTime,
        updateTime: m.updateTime
    }
}

export function parsePurchaseWithProjectSchema(
    data: Purchase & { project: Pick<Project, "id" | "type" | "title" | "resources"> }
): PurchaseWithProjectSchema {
    return {
        ...parsePurchaseSchema(data),
        project: parseProjectSimpleSchema(data.project)
    }
}

export function parsePurchaseSummarySchema(data: PurchaseSummary): PurchaseSummarySchema {
    const m = data as unknown as PurchaseSummaryModel
    return {
        projectId: m.projectId,
        totalCost: Number(m.totalCost),
        totalCount: m.totalCount,
        createTime: m.createTime,
        updateTime: m.updateTime
    }
}

export function parsePurchaseSummaryWithProjectSchema(
    data: PurchaseSummary & { project: Pick<Project, "id" | "type" | "title" | "resources"> }
): PurchaseSummaryWithProjectSchema {
    return {
        ...parsePurchaseSummarySchema(data),
        project: parseProjectSimpleSchema(data.project)
    }
}
