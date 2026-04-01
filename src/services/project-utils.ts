import type { Staff, Tag } from "@/prisma/generated"
import { EpisodePublishRecord, EpisodePublishRecordModel } from "@/schemas/project"
import { CreateStaffError, CreateTagError } from "@/schemas/error"
import { Result, err, ok } from "@/schemas/all"
import { ProjectType } from "@/constants/project"
import { requireAccess } from "@/helpers/auth-guard"
import { prisma } from "@/lib/prisma"
import { createTag } from "./tag"
import { createStaff } from "./staff"

export async function saveTags(projectId: string, type: ProjectType, tags: string[]): Promise<Result<void, CreateTagError>> {
    await requireAccess("project", "write")
    // 获取所有已存在的tag
    const existingTags = tags.length > 0 ? await prisma.tag.findMany({
        where: {
            type,
            name: {in: tags}
        }
    }) : []

    // 找出需要新建的tag名称
    const existingTagNames = existingTags.map(t => t.name)
    const newTagNames = tags.filter(t => !existingTagNames.includes(t))

    const allTags: Tag[] = existingTags
    if(newTagNames.length > 0) {
        const newTagResults = await Promise.all(newTagNames.map(name => createTag({name, description: "", type})))
        for(const r of newTagResults) {
            if(!r.ok) return err(r.err)
            allTags.push({
                ...r.value,
                type: r.value.type as ProjectType
            } as Tag)
        }
    }    

    // 获取当前project的所有tag关联
    const currentRelations = await prisma.projectTagRelation.findMany({
        where: {
            projectId
        }
    })

    // 需要保留的tagId列表
    const targetTagIds = allTags.map(t => t.id)
    
    // 需要删除的关联
    const toDelete = currentRelations.filter(r => !targetTagIds.includes(r.tagId))
    
    // 已存在的tagId列表
    const existingTagIds = currentRelations.map(r => r.tagId)
    
    // 需要新增的关联
    const toCreate = targetTagIds.filter(id => !existingTagIds.includes(id))

    // 执行删除操作
    if(toDelete.length > 0) {
        await prisma.projectTagRelation.deleteMany({
            where: {
                projectId,
                tagId: {in: toDelete.map(r => r.tagId)}
            }
        })
    }

    // 执行创建操作
    if(toCreate.length > 0) {
        await prisma.projectTagRelation.createMany({
            data: toCreate.map(tagId => ({
                projectId,
                tagId
            }))
        })
    }
    return ok(undefined)
}

export async function saveStaffs(projectId: string, staffs: {type: string, members: string[]}[]): Promise<Result<void, CreateStaffError>> {
    await requireAccess("project", "write")
    // 获取所有staff名字
    const staffNames = Array.from(new Set(staffs.flatMap(s => s.members)))

    // 获取已存在的staff
    const existingStaffs = await prisma.staff.findMany({where: {name: {in: staffNames}}})

    // 找出需要新建的staff
    const existingStaffNames = existingStaffs.map(s => s.name)
    const newStaffNames = staffNames.filter(s => !existingStaffNames.includes(s))

    // 合并已有和新建的staff
    const allStaffs: Staff[] = existingStaffs
    if(newStaffNames.length > 0) {
        const newStaffResults = await Promise.all(newStaffNames.map(name => createStaff({name, otherNames: [], description: ""})))
        for(const r of newStaffResults) {
            if(!r.ok) return err(r.err)
            allStaffs.push({
                ...r.value,
                otherNames: r.value.otherNames.join("|")
            } as Staff)
        }
    }

    // 获取当前project的所有staff关联
    const currentRelations = await prisma.projectStaffRelation.findMany({
        where: {
            projectId
        }
    })

    // 构建目标关联列表
    const targetRelations = staffs.flatMap(s => 
        s.members.map(m => ({
            staffId: allStaffs.find(staff => staff.name === m)!.id,
            staffType: s.type
        }))
    )

    // 需要删除的关联
    const toDelete = currentRelations.filter(r => 
        !targetRelations.some(tr => 
            tr.staffId === r.staffId && tr.staffType === r.staffType
        )
    )

    // 需要新增的关联
    const toCreate = targetRelations.filter(tr =>
        !currentRelations.some(r =>
            r.staffId === tr.staffId && r.staffType === tr.staffType
        )
    )

    // 执行删除操作
    if(toDelete.length > 0) {
        await prisma.projectStaffRelation.deleteMany({
            where: {
                projectId,
                OR: toDelete.map(r => ({
                    staffId: r.staffId,
                    staffType: r.staffType
                }))
            }
        })
    }

    // 执行创建操作
    if(toCreate.length > 0) {
        await prisma.projectStaffRelation.createMany({
            data: toCreate.map(r => ({
                projectId,
                staffId: r.staffId,
                staffType: r.staffType
            }))
        })
    }
    return ok(undefined)
}

export function processEpisodePlan(totalNum: number, newPublishedNum: number, newPublishPlan: EpisodePublishRecord[], originPublishedRecords: EpisodePublishRecord[], now: Date) {
    const actualPublishedNum = newPublishedNum > totalNum ? totalNum : newPublishedNum
    const remainNum = totalNum - actualPublishedNum
    const planWithDate = newPublishPlan
        .filter(p => p.publishTime).map(p => ({ ...p, date: new Date(p.publishTime!) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, remainNum)

    const beforeNowPlan = planWithDate.filter(p => p.date.getTime() <= now.getTime())
    const afterNowPlan = planWithDate.filter(p => p.date.getTime() > now.getTime())

    const actualPublishedRecords = Array(actualPublishedNum).fill(null).map((_, index) => {
        const record = originPublishedRecords.find(p => p.index === index + 1)
        return record ?? {
            index: index + 1,
            publishTime: null,
            actualEpisodeNum: null,
            episodeTitle: null
        }
    })

    const publishedNum = actualPublishedNum + beforeNowPlan.length
    const publishedRecords = [
        ...actualPublishedRecords,
        ...beforeNowPlan.map((p, idx) => ({
            index: actualPublishedNum + idx + 1,
            publishTime: p.publishTime,
            actualEpisodeNum: p.actualEpisodeNum,
            episodeTitle: p.episodeTitle
        }))
    ]

    const publishPlan = afterNowPlan.map((p, idx) => ({
        index: publishedNum + idx + 1,
        publishTime: p.publishTime,
        actualEpisodeNum: p.actualEpisodeNum,
        episodeTitle: p.episodeTitle
    }))
    return { publishedNum, publishPlan, publishedRecords }
}

export function processEpisodePlanAutoUpdate(totalNum: number, publishedNum: number, publishPlan: EpisodePublishRecord[], publishedRecords: EpisodePublishRecord[], now: Date) {
    const planWithDate = publishPlan.filter(p => p.publishTime).map(p => ({ ...p, date: new Date(p.publishTime!) }))

    const beforeNowPlan = planWithDate.filter(p => p.date.getTime() <= now.getTime())
    if(beforeNowPlan.length <= 0) {
        return null
    }
    const afterNowPlan = planWithDate.filter(p => p.date.getTime() > now.getTime())

    const newPublishedNum = Math.min(totalNum, publishedNum + beforeNowPlan.length)
    const oldPublishedRecords = Array(publishedNum).fill(null).map((_, index) => {
        const record = publishedRecords.find(p => p.index === index + 1)
        return record ?? {
            index: index + 1,
            publishTime: null,
            actualEpisodeNum: null,
            episodeTitle: null
        }
    })
    const newPublishedRecords: EpisodePublishRecordModel[] = [
        ...oldPublishedRecords,
        ...beforeNowPlan.map((p, idx) => ({
            index: publishedNum + idx + 1,
            publishTime: p.publishTime,
            actualEpisodeNum: p.actualEpisodeNum,
            episodeTitle: p.episodeTitle
        }))
    ]
    const newPublishPlan: EpisodePublishRecordModel[] = afterNowPlan.map((p, idx) => ({
        index: newPublishedNum + idx + 1,
        publishTime: p.publishTime,
        actualEpisodeNum: p.actualEpisodeNum,
        episodeTitle: p.episodeTitle
    }))

    return { publishedNum: newPublishedNum, publishPlan: newPublishPlan, publishedRecords: newPublishedRecords }
}
