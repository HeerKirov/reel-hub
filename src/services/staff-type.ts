"use server"
import { prisma } from "@/lib/prisma"
import { exceptionParamError } from "@/constants/exception"
import { safeExecute } from "@/helpers/execution"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { ListStaffTypesError } from "@/schemas/error"
import { StaffTypeListFilter, StaffTypeSchema, staffTypeListFilter } from "@/schemas/staff-type"

export async function listStaffTypes(filter: StaffTypeListFilter): Promise<Result<ListResult<StaffTypeSchema>, ListStaffTypesError>> {
    return safeExecute(async () => {
        const validate = staffTypeListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const projectType = validate.data.projectType
        const search = validate.data.search?.trim()

        // staffType 是自由字符串，不需要维护字典表；
        // 这里从 projectStaffRelation 里取 distinct 的 staffType，再附上当前 projectType 便于前端消费。
        const list = await prisma.projectStaffRelation.findMany({
            where: {
                staffType: search ? { contains: search, mode: "insensitive" as const } : undefined,
                project: { type: projectType }
            },
            distinct: ["staffType"],
            orderBy: { staffType: "asc" },
            select: { staffType: true }
        })

        return ok({
            list: list.map(i => ({ staffType: i.staffType, projectType })),
            total: list.length
        })
    })
}

