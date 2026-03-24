"use server"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { prisma } from "@/lib/prisma"
import { exceptionParamError, safeExecuteResult } from "@/constants/exception"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { CreateStaffError, DeleteStaffError, ListStaffsError, UpdateStaffError } from "@/schemas/error"
import { StaffCreateFormSchema, StaffListFilter, staffCreateFormSchema, StaffSchema, staffListFilter, staffUpdateFormSchema, StaffUpdateFormSchema, parseStaffSchema } from "@/schemas/staff"

export async function listStaffs(filter: StaffListFilter): Promise<Result<ListResult<StaffSchema>, ListStaffsError>> {
    return safeExecuteResult(async () => {
        const validate = staffListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where = {
            name: validate.data.search ? {contains: validate.data.search, mode: "insensitive" as const} : undefined,
            otherNames: validate.data.search ? {contains: validate.data.search, mode: "insensitive" as const} : undefined
        }
        const [r, total] = await Promise.all([
            prisma.staff.findMany({
                where,
                orderBy: {
                    createTime: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.staff.count({ where })
        ])

        return ok({
            list: r.map(parseStaffSchema),
            total
        })
    })
}

export async function createStaff(form: StaffCreateFormSchema): Promise<Result<StaffSchema, CreateStaffError>> {
    return safeExecuteResult(async () => {
        await requireAccess("staff", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = staffCreateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))
        
        const created = await prisma.staff.create({
            data: {
                ...validate.data,
                otherNames: validate.data.otherNames?.join("|") ?? "",
                createTime: now,
                updateTime: now,
                creator: userId,
                updator: userId
            }
        })
        return ok(parseStaffSchema(created))
    })
}

export async function retrieveStaff(id: number): Promise<StaffSchema | null> {
    const r = await prisma.staff.findUnique({where: { id }})
    if(!r) return null

    return parseStaffSchema(r)
}

export async function updateStaff(id: number, form: StaffUpdateFormSchema): Promise<Result<StaffSchema, UpdateStaffError>> {
    return safeExecuteResult(async () => {
        await requireAccess("staff", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = staffUpdateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const updated = await prisma.staff.update({
            where: { id },
            data: {
                ...validate.data,
                otherNames: validate.data.otherNames?.join("|") ?? "",
                updateTime: now,
                updator: userId
            }
        })

        return ok(parseStaffSchema(updated))
    })
}

export async function deleteStaff(id: number): Promise<Result<void, DeleteStaffError>> {
    return safeExecuteResult(async () => {
        await requireAccess("staff", "write")
        await prisma.staff.delete({where: { id }})
        await prisma.projectStaffRelation.deleteMany({where: {staffId: id}})
        return ok(undefined)
    })
} 