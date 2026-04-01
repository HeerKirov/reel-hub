"use server"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { prisma } from "@/lib/prisma"
import { exceptionAlreadyExists, exceptionNotFound, exceptionParamError } from "@/constants/exception"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { CreateStaffError, DeleteStaffError, ListStaffsError, UpdateStaffError } from "@/schemas/error"
import { StaffCreateFormSchema, StaffListFilter, staffCreateFormSchema, StaffSchema, staffListFilter, staffUpdateFormSchema, StaffUpdateFormSchema, parseStaffSchema } from "@/schemas/staff"

export async function listStaffs(filter: StaffListFilter): Promise<Result<ListResult<StaffSchema>, ListStaffsError>> {
    return safeExecute(async () => {
        const validate = staffListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const search = validate.data.search?.trim()
        const where = {
            projects: validate.data.type ? { some: { project: { type: validate.data.type } } } : undefined,
            OR: search ? [
                { name: { contains: search, mode: "insensitive" as const } },
                { otherNames: { contains: search, mode: "insensitive" as const } }
            ] : undefined
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
    return safeExecuteTransaction(async tx => {
        await requireAccess("staff", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = staffCreateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const exists = await tx.staff.findFirst({
            where: {
                name: validate.data.name
            }
        })
        if(exists) return err(exceptionAlreadyExists("staff", "name", validate.data.name))
        
        const created = await tx.staff.create({
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

export async function updateStaff(id: number, form: StaffUpdateFormSchema): Promise<Result<void, UpdateStaffError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("staff", "write")
        const userId = await getUserId()

        const validate = staffUpdateFormSchema.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const self = await tx.staff.findUnique({ where: { id } })
        if(!self) return err(exceptionNotFound("Staff not found"))

        const newName = validate.data.name !== undefined && validate.data.name !== self.name ? validate.data.name : undefined
        const newOtherNames = validate.data.otherNames !== undefined && validate.data.otherNames?.join("|") !== self.otherNames ? validate.data.otherNames?.join("|") : undefined
        const newDescription = validate.data.description !== undefined && validate.data.description !== self.description ? validate.data.description : undefined

        if(newName !== undefined) {
            const exists = await tx.staff.findFirst({
                where: {
                    id: { not: id },
                    name: newName
                }
            })
            if(exists) return err(exceptionAlreadyExists("staff", "name", newName))
        }

        if(newName !== undefined || newOtherNames !== undefined || newDescription !== undefined) {
            const now = new Date()

            await tx.staff.update({
                where: { id },
                data: {
                    name: newName,
                    otherNames: newOtherNames,
                    description: newDescription,
                    updateTime: now,
                    updator: userId
                }
            })
        }

        return ok(undefined)
    })
}

export async function deleteStaff(id: number): Promise<Result<void, DeleteStaffError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("staff", "write")

        const self = await tx.staff.findUnique({ where: { id } })
        if(!self) return err(exceptionNotFound("Staff not found"))

        await tx.projectStaffRelation.deleteMany({where: {staffId: id}})
        await tx.staff.delete({where: { id }})
        return ok(undefined)
    })
}