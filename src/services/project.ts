"use server"
import { ProjectListFilter, projectListFilter } from "@/schemas/project"
import { ListProjectError } from "@/schemas/error"
import { Result, err, ok } from "@/schemas/all"
import { ProjectType } from "@/constants/project"
import { exceptionParamError, safeExecuteResult } from "@/constants/exception"
import { prisma } from "@/lib/prisma"

export async function findProject(filter: ProjectListFilter): Promise<Result<{id: string, type: ProjectType, title: string, subtitles: string[]}[], ListProjectError>> {
    return safeExecuteResult(async () => {
        const validate = projectListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const r = await prisma.project.findMany({
            where: {
                type: validate.data.type ?? undefined,
                OR: validate.data.search ? [
                    {title: {contains: validate.data.search}},
                    {subtitles: {contains: validate.data.search}},
                    {keywords: {contains: validate.data.search}}
                ] : undefined
            },
            orderBy: {
                publishTime: "desc"
            },
            skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
            take: validate.data.size ?? 15,
            select: {
                id: true,
                type: true,
                title: true,
                subtitles: true
            }
        })

        return ok(r.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            subtitles: item.subtitles.split("|").filter(s => s !== "")
        })))
    })
}
