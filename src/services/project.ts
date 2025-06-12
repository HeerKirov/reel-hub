"use server"
import { prisma } from "@/lib/prisma"
import { ProjectRelationModel, ProjectRelationType, projectRelationItemSchema } from "@/schemas/project"
import { arrays, records } from "@/helpers/primitive"
import { ProjectType } from "@/constants/project"
import { Staff, Tag } from "@/prisma/generated"
import { createTag } from "./tag"
import { createStaff } from "./staff"


export async function getRelations(relations: ProjectRelationModel, relationsTopology: ProjectRelationModel): Promise<{relations: ProjectRelationType, relationsTopology: ProjectRelationType}> {
    const ids = Object.values(relations).flat().concat(Object.values(relationsTopology).flat())
    const r = await prisma.project.findMany({where: {id: {in: ids}}})
    const items = r.map(i => projectRelationItemSchema.parse(i))
    const maps = arrays.associateBy(items, i => i.id)
    return {
        relations: records.map(relations, a => a.map(i => maps[i])),
        relationsTopology: records.map(relationsTopology, a => a.map(i => maps[i]))
    }
}

export async function saveTags(projectId: string, type: ProjectType, tags: string[]): Promise<void> {
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
        const newTags = await Promise.all(newTagNames.map(name => createTag({name, description: "", type})))
        allTags.push(...newTags)
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
}

export async function saveStaffs(projectId: string, staffs: {type: string, members: string[]}[]): Promise<void> {
    // 获取所有staff名字
    const staffNames = [...new Set(staffs.flatMap(s => s.members))]

    // 获取已存在的staff
    const existingStaffs = await prisma.staff.findMany({where: {name: {in: staffNames}}})

    // 找出需要新建的staff
    const existingStaffNames = existingStaffs.map(s => s.name)
    const newStaffNames = staffNames.filter(s => !existingStaffNames.includes(s))

    // 合并已有和新建的staff
    const allStaffs: Staff[] = existingStaffs
    if(newStaffNames.length > 0) {
        const newStaffs = await Promise.all(newStaffNames.map(name => createStaff({name, otherNames: [], description: ""})))
        allStaffs.push(...newStaffs)
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
}