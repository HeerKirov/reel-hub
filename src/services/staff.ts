"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { StaffCreateFormSchema, StaffListFilter, staffCreateFormSchema, StaffSchema, staffListFilter, staffUpdateFormSchema, StaffUpdateFormSchema, parseStaffSchema } from "@/schemas/staff"

export async function listStaffs(filter: StaffListFilter): Promise<StaffSchema[]> {
    const validate = staffListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)
    
    const r = await prisma.staff.findMany({
        where: {
            name: validate.data.search ? {contains: validate.data.search, mode: 'insensitive'} : undefined,
            otherNames: validate.data.search ? {contains: validate.data.search, mode: 'insensitive'} : undefined
        },
        orderBy: {
            createTime: "desc"
        }
    })

    return r.map(parseStaffSchema)
}

export async function createStaff(form: StaffCreateFormSchema) {
    const userId = await getUserId()
    const now = new Date()

    const validate = staffCreateFormSchema.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)
    
    return await prisma.staff.create({
        data: {
            ...validate.data,
            otherNames: validate.data.otherNames?.join(",") ?? "",
            createTime: now,
            updateTime: now,
            creator: userId,
            updator: userId
        }
    })
}

export async function retrieveStaff(id: number): Promise<StaffSchema | null> {
    const r = await prisma.staff.findUnique({where: { id }})
    if(!r) return null

    return parseStaffSchema(r)
}

export async function updateStaff(id: number, form: StaffUpdateFormSchema) {
    const userId = await getUserId()
    const now = new Date()

    const validate = staffUpdateFormSchema.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    return await prisma.staff.update({
        where: { id },
        data: {
            ...validate.data,
            otherNames: validate.data.otherNames?.join(",") ?? "",
            updateTime: now,
            updator: userId
        }
    })
}

export async function deleteStaff(id: number) {
    await prisma.staff.delete({where: { id }})
    await prisma.projectStaffRelation.deleteMany({where: {staffId: id}})
} 