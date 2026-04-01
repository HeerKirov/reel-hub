"use server"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { exceptionNotFound, exceptionParamError, exceptionReject } from "@/constants/exception"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import {
    parsePurchaseSummaryWithProjectSchema, parsePurchaseWithProjectSchema, purchaseCreateForm, purchaseUpdateForm, purchaseListFilter, purchaseSummaryListFilter,
    PurchaseListFilter, PurchaseSummaryListFilter, PurchaseCreateForm, PurchaseUpdateForm, PurchaseWithProjectSchema, PurchaseSummaryWithProjectSchema,
    parsePurchaseSummarySchema,
    PurchaseSummarySchema,
} from "@/schemas/purchase"
import { CreatePurchaseError, DeletePurchaseError, ListPurchaseError, ListPurchaseSummaryError, UpdatePurchaseError } from "@/schemas/error"
import { Prisma, ProjectType } from "@/prisma/generated"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"

export async function listPurchases(filter: PurchaseListFilter): Promise<Result<ListResult<PurchaseWithProjectSchema>, ListPurchaseError>> {
    return safeExecute(async () => {
        await requireAccess("purchase", "read")
        const userId = await getUserId()
        const validate = purchaseListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where: Prisma.PurchaseWhereInput = {
            ownerId: userId,
            projectId: validate.data.projectId,
            purchaseType: validate.data.purchaseType,
            project: {
                type: ProjectType.GAME,
                platform: validate.data.platform !== undefined ? { has: validate.data.platform } : undefined,
                onlineType: validate.data.onlineType,
                OR: validate.data.search ? [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ] : undefined
            }
        }

        const [records, total] = await Promise.all([
            prisma.purchase.findMany({
                where,
                include: {
                    project: { select: { id: true, type: true, title: true, resources: true } }
                },
                orderBy: {
                    [validate.data.orderBy ?? "purchaseTime"]: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.purchase.count({ where })
        ])

        return ok({
            list: records.map(parsePurchaseWithProjectSchema),
            total
        })
    })
}

export async function listPurchaseSummary(filter: PurchaseSummaryListFilter): Promise<Result<ListResult<PurchaseSummaryWithProjectSchema>, ListPurchaseSummaryError>> {
    return safeExecute(async () => {
        await requireAccess("purchase", "read")
        const userId = await getUserId()
        const validate = purchaseSummaryListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where: Prisma.PurchaseSummaryWhereInput = {
            ownerId: userId,
            projectId: validate.data.projectId,
            project: {
                type: ProjectType.GAME,
                platform: validate.data.platform !== undefined ? { has: validate.data.platform } : undefined,
                onlineType: validate.data.onlineType,
                OR: validate.data.search ? [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ] : undefined
            }
        }

        const [rows, total] = await Promise.all([
            prisma.purchaseSummary.findMany({
                where,
                include: {
                    project: { select: { id: true, type: true, title: true, resources: true } }
                },
                orderBy: {
                    [validate.data.orderBy ?? "totalCost"]: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.purchaseSummary.count({ where })
        ])

        return ok({
            list: rows.map(parsePurchaseSummaryWithProjectSchema),
            total
        })
    })
}

export async function retrievePurchaseSummary(projectId: string): Promise<Result<PurchaseSummarySchema | null, ListPurchaseSummaryError>> {
    return safeExecute(async () => {
        await requireAccess("purchase", "read")
        const userId = await getUserId()

        const purchaseSummary = await prisma.purchaseSummary.findUnique({ 
            where: { 
                ownerId_projectId: { ownerId: userId, projectId } 
            } 
        })
        if(!purchaseSummary) return ok(null)

        return ok(parsePurchaseSummarySchema(purchaseSummary))
    })
}

export async function createPurchase(form: PurchaseCreateForm): Promise<Result<void, CreatePurchaseError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("purchase", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = purchaseCreateForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await tx.project.findUnique({ where: { id: validate.data.projectId }, select: { id: true, type: true } })
        if(!project) return err(exceptionNotFound("Project not found"))
        if(project.type !== ProjectType.GAME) return err(exceptionReject("Purchase is only available for GAME project"))

        await tx.purchase.create({
            data: {
                ownerId: userId,
                projectId: validate.data.projectId,
                purchaseType: validate.data.purchaseType,
                description: validate.data.description,
                cost: validate.data.cost,
                purchaseTime: validate.data.purchaseTime,
                createTime: now,
                updateTime: now
            }
        })

        await refreshPurchaseSummary(tx, userId, validate.data.projectId, now)

        return ok(undefined)
    })
}

export async function updatePurchase(id: string, form: PurchaseUpdateForm): Promise<Result<void, UpdatePurchaseError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("purchase", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = purchaseUpdateForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const purchase = await tx.purchase.findFirst({
            where: { id, ownerId: userId },
            include: { project: { select: { type: true } } }
        })
        if(!purchase) return err(exceptionNotFound("Purchase not found"))
        if(purchase.project.type !== ProjectType.GAME) return err(exceptionReject("Purchase is only available for GAME project"))

        const nextProjectId = validate.data.projectId ?? purchase.projectId
        if(validate.data.projectId) {
            const project = await tx.project.findUnique({ where: { id: validate.data.projectId }, select: { id: true, type: true } })
            if(!project) return err(exceptionNotFound("Project not found"))
            if(project.type !== ProjectType.GAME) return err(exceptionReject("Purchase is only available for GAME project"))
        }

        await tx.purchase.update({
            where: { id },
            data: {
                projectId: validate.data.projectId,
                purchaseType: validate.data.purchaseType,
                description: validate.data.description,
                cost: validate.data.cost,
                purchaseTime: validate.data.purchaseTime,
                updateTime: now
            }
        })

        await refreshPurchaseSummary(tx, userId, purchase.projectId, now)
        if(nextProjectId !== purchase.projectId) {
            await refreshPurchaseSummary(tx, userId, nextProjectId, now)
        }

        return ok(undefined)
    })
}

export async function deletePurchase(id: string): Promise<Result<void, DeletePurchaseError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("purchase", "write")
        const userId = await getUserId()
        const now = new Date()

        const purchase = await tx.purchase.findFirst({
            where: { id, ownerId: userId },
            include: { project: { select: { type: true } } }
        })
        if(!purchase) return err(exceptionNotFound("Purchase not found"))
        if(purchase.project.type !== ProjectType.GAME) return err(exceptionReject("Purchase is only available for GAME project"))

        await tx.purchase.delete({ where: { id } })
        await refreshPurchaseSummary(tx, userId, purchase.projectId, now)

        return ok(undefined)
    })
}

async function refreshPurchaseSummary(tx: Prisma.TransactionClient, ownerId: string, projectId: string, now: Date): Promise<void> {
    const aggregate = await tx.purchase.aggregate({
        where: { ownerId, projectId },
        _sum: { cost: true },
        _count: { _all: true }
    })

    if(aggregate._sum.cost === null || aggregate._count._all === 0) {
        await tx.purchaseSummary.deleteMany({
            where: { ownerId, projectId }
        })
        return
    }

    await tx.purchaseSummary.upsert({
        where: {
            ownerId_projectId: { ownerId, projectId }
        },
        create: {
            ownerId,
            projectId,
            totalCost: aggregate._sum.cost,
            totalCount: aggregate._count._all,
            createTime: now,
            updateTime: now
        },
        update: {
            totalCost: aggregate._sum.cost,
            totalCount: aggregate._count._all,
            updateTime: now
        }
    })
}