"use server"
import { prisma } from "@/lib/prisma"
import { ProjectRelationModel, ProjectRelationType, projectRelationItemSchema, ProjectListFilter, projectListFilter } from "@/schemas/project"
import { arrays, records } from "@/helpers/primitive"
import { ProjectType, RelationType, RELATION_TYPE_VALUES } from "@/constants/project"
import { Staff, Tag } from "@/prisma/generated"
import { RelationGraph } from "@/helpers/relation-graph"
import { createTag } from "./tag"
import { createStaff } from "./staff"


export async function listProject(filter: ProjectListFilter): Promise<{id: string, type: ProjectType, title: string, subtitles: string[]}[]> {
    const validate = projectListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)

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

    return r.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitles: item.subtitles.split("|").filter(s => s !== "")
    }))
}

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
    const staffNames = Array.from(new Set(staffs.flatMap(s => s.members)))

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

/**
 * 更新项目的关联拓扑
 * 首先根据旧的拓扑，找出所有关联对象。然后加入新的拓扑关联对象，构成全量图。
 * 然后，对全量图进行关系传播推导，导出所有对象的全量拓扑，并更新那些拓扑发生变化的对象。
 */
export async function updateRelations(projectId: string, relations: Partial<ProjectRelationModel>): Promise<void> {
    const newRelations = validateRelation(relations)
    
    // 查到主对象
    const thisProject = await find(projectId)
    if (!thisProject) {
        throw new Error(`Cannot find project ${projectId}`)
    }

    // 比对主对象的旧关联拓扑和新关联拓扑，找出新增的那些节点
    // 而如果关联拓扑没有变化，那么退出这个方法
    const changes = compareRelationAdds(thisProject.relations, newRelations)
    if (changes.length === 0 && compareRelationEquals(thisProject.relations, newRelations)) {
        return
    }

    // 节点列表
    const elements = new Map<string, ProjectModel>()
    
    // 将主对象放入图中
    elements.set(projectId, thisProject)
    
    // 将主对象的旧的全量拓扑的关联节点放入图中
    const currentTopologyIds = Object.values(thisProject.relationsTopology).flat()
    if (currentTopologyIds.length > 0) {
        const currentTopologyProjects = await findAll(currentTopologyIds as string[])
        currentTopologyProjects.forEach(p => elements.set(p.id, p))
    }

    // 查找上述拓扑比对结果中新增节点，将它们放入图中。在那之前，计算id和exists的差以减少查询
    const changesMinusExists = changes.filter(id => !elements.has(id))
    if (changesMinusExists.length > 0) {
        const appendProjects = await findAll(changesMinusExists)
        appendProjects.forEach(p => elements.set(p.id, p))
    }

    // 查找上述拓扑比对结果中新增节点的全量拓扑，将它们也都放入图中。在那之前，计算id和exists的差以减少查询
    const appendProjectIds = Array.from(elements.keys()).filter(id => id !== projectId)
    if (appendProjectIds.length > 0) {
        const appendProjects = await findAll(appendProjectIds)
        const changesTopologyIds = appendProjects.flatMap(p => 
            Object.values(p.relationsTopology).flat()
        )
        const changesTopologyIdsMinusExists = changesTopologyIds.filter((id: any) => !elements.has(id))
        if (changesTopologyIdsMinusExists.length > 0) {
            const changesTopologyProjects = await findAll(changesTopologyIdsMinusExists as string[])
            changesTopologyProjects.forEach(p => elements.set(p.id, p))
        }
    }

    // 根据所有在场的节点的关联拓扑(主对象的为新关联拓扑)，将关系放入图中，随后构建传播图
    const graph = buildRelationGraph(Array.from(elements.values()), thisProject, newRelations)

    // 从传播图导出每一个节点的全量拓扑
    // 比对每个节点的新旧全量拓扑，发生变化的放入保存列表；主对象要更新关联拓扑，也要放入保存列表
    // 批量保存
    const updates: Array<{id: string, relationsTopology: ProjectRelationModel}> = []
    
    for (const element of Array.from(elements.values())) {
        if (element.id !== projectId) {
            const newTopology = graph.get(element, (e: ProjectModel) => e.id)
            const topologyAsStrings = convertTopologyToStrings(newTopology)
            if (!compareRelationEquals(element.relationsTopology, topologyAsStrings)) {
                updates.push({
                    id: element.id,
                    relationsTopology: topologyAsStrings
                })
            }
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates.map(update => 
            prisma.project.update({
                where: { id: update.id },
                data: { relationsTopology: update.relationsTopology }
            })
        ))
    }

    const newThisTopology = graph.get(thisProject, (e: ProjectModel) => e.id)
    const thisTopologyAsStrings = convertTopologyToStrings(newThisTopology)

    await prisma.project.update({
        where: { id: projectId },
        data: {
            relations: newRelations,
            relationsTopology: thisTopologyAsStrings
        }
    })
}

/**
 * 对全部project的relation进行更新。
 * @return 有多少project得到了更新
 */
export async function updateAllRelationTopology(): Promise<number> {
    const elements = await prisma.project.findMany({
        select: {
            id: true,
            relations: true,
            relationsTopology: true,
            createTime: true
        },
        orderBy: {
            createTime: 'asc'
        }
    })

    const projectModels = elements.map(e => ({
        id: e.id,
        relations: e.relations as ProjectRelationModel,
        relationsTopology: e.relationsTopology as ProjectRelationModel,
        createTime: e.createTime
    }))

    const graph = buildRelationGraphForAll(projectModels)

    let num = 0
    const updates: Array<{id: string, relationsTopology: ProjectRelationModel}> = []

    for (const element of projectModels) {
        const topology = graph.get(element, (e: ProjectModel) => e.id)
        const topologyAsStrings = convertTopologyToStrings(topology)
        if (Object.keys(topologyAsStrings).length > 0) {
            updates.push({
                id: element.id,
                relationsTopology: topologyAsStrings
            })
            num += 1
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates.map(update => 
            prisma.project.update({
                where: { id: update.id },
                data: { relationsTopology: update.relationsTopology }
            })
        ))
    }

    return num
}

/**
 * 从一个project的全部关联中移除此project。
 * 首先根据全量拓扑，找出所有关联对象。将除原对象外的所有关联对象放入图。
 * 遍历这些对象的所有直接关联关系，从之中移除全部原对象，然后将剩余关系放入图。
 * 随后推导全量图，将新的全量拓扑和变化的关联对象更新到其对应的对象。
 */
export async function removeProjectInTopology(projectId: string, topology: ProjectRelationModel): Promise<void> {
    // 节点列表
    const elements = new Map<string, ProjectModel>()
    
    // 查找全量拓扑的关联节点，放入图中
    const topologyIds = Object.values(topology).flat()
    if (topologyIds.length > 0) {
        const topologyProjects = await findAll(topologyIds as string[])
        topologyProjects.forEach(p => elements.set(p.id, p))
    }

    // relation发生变动的节点
    const relationChanges = new Map<string, ProjectRelationModel>()

    // 构建图
    const graph = buildRelationGraphForRemoval(Array.from(elements.values()), projectId, relationChanges)

    // 从传播图导出每一个节点的全量拓扑
    // 比对每个节点的全量拓扑，发生变化的放入保存列表。relation发生变动的，也要放入保存列表
    // 批量保存
    const updates: Array<{id: string, relations: ProjectRelationModel, relationsTopology: ProjectRelationModel}> = []

    for (const element of Array.from(elements.values())) {
        const newRelations = relationChanges.get(element.id)
        const newTopology = graph.get(element, (e: ProjectModel) => e.id)
        const topologyAsStrings = convertTopologyToStrings(newTopology)
        
        if (newRelations || !compareRelationEquals(element.relationsTopology, topologyAsStrings)) {
            updates.push({
                id: element.id,
                relations: newRelations || element.relations,
                relationsTopology: topologyAsStrings
            })
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates.map(update => 
            prisma.project.update({
                where: { id: update.id },
                data: {
                    relations: update.relations,
                    relationsTopology: update.relationsTopology
                }
            })
        ))
    }
}

/**
 * 从数据库查找指定id的project的拓扑关系。
 */
async function find(projectId: string): Promise<ProjectModel | null> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            relations: true,
            relationsTopology: true,
            createTime: true
        }
    })

    if (!project) return null

    return {
        id: project.id,
        relations: project.relations as ProjectRelationModel,
        relationsTopology: project.relationsTopology as ProjectRelationModel,
        createTime: project.createTime
    }
}

/**
 * 从数据库查找全部id的project的拓扑关系。
 */
async function findAll(projectIds: string[]): Promise<ProjectModel[]> {
    if (projectIds.length === 0) {
        return []
    }

    const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: {
            id: true,
            relations: true,
            relationsTopology: true,
            createTime: true
        }
    })

    if (projects.length < projectIds.length) {
        const foundIds = new Set(projects.map(p => p.id))
        const missingIds = projectIds.filter(id => !foundIds.has(id))
        throw new Error(`Project ${missingIds.join(", ")} not exists.`)
    }

    return projects.map(p => ({
        id: p.id,
        relations: p.relations as ProjectRelationModel,
        relationsTopology: p.relationsTopology as ProjectRelationModel,
        createTime: p.createTime
    }))
}

/**
 * 对目标拓扑进行优化整理。
 * - 去除没有项的关系。
 * - 移除同关系下重复的id。
 * - 如果存在不同关系下重复的id，那么抛出异常。
 */
function validateRelation(relations: Partial<ProjectRelationModel>): ProjectRelationModel {
    const map: ProjectRelationModel = {} as ProjectRelationModel
    const idSet = new Set<string>()

    for (const relationType of RELATION_TYPE_VALUES) {
        const list = relations[relationType]
        if (Array.isArray(list) && list.length > 0) {
            const distinctList = Array.from(new Set(list))
            for (const id of distinctList) {
                if (idSet.has(id)) {
                    throw new Error(`Relation of project ${id} is duplicated.`)
                }
            }
            distinctList.forEach(id => idSet.add(id))
            map[relationType] = distinctList
        }
    }

    return map
}

/**
 * 比较两个关系拓扑。找出新拓扑中比旧拓扑多出的新节点。
 */
function compareRelationAdds(oldRelations: ProjectRelationModel, newRelations: ProjectRelationModel): string[] {
    const old = new Set(Object.values(oldRelations).flat())
    const new_ = new Set(Object.values(newRelations).flat())
    return Array.from(new_).filter((id: any) => !old.has(id))
}

/**
 * 比较两个关系拓扑。查看两个拓扑是否等价。
 * 不能通过#compareRelationAdds集合为空来做这项判断，因为有可能变换关系类型。
 */
function compareRelationEquals(oldRelations: ProjectRelationModel, newRelations: ProjectRelationModel): boolean {
    for (const relationType of RELATION_TYPE_VALUES) {
        const old = new Set(oldRelations[relationType] || [])
        const new_ = new Set(newRelations[relationType] || [])
        if (old.size !== new_.size) return false
        for (const id of old) {
            if (!new_.has(id)) return false
        }
    }
    return true
}

/**
 * 在关系中查找并移除指定的id。如果至少有一个id被移除，那么返回变更后的关系。
 */
function findAndRemoveIdInRelation(relations: ProjectRelationModel, id: string): ProjectRelationModel | null {
    const map: ProjectRelationModel = {} as ProjectRelationModel
    let any = false
    for (const relationType of RELATION_TYPE_VALUES) {
        const list = relations[relationType]
        if (Array.isArray(list)) {
            const newList = list.filter(item => item !== id)
            if (newList.length > 0) {
                map[relationType] = newList
            }
            if (newList.length < list.length) {
                any = true
            }
        }
    }
    return any ? map : null
}

/**
 * 构建关系传播图（用于单个项目更新）
 */
function buildRelationGraph(
    projects: ProjectModel[], 
    thisProject: ProjectModel, 
    newRelations: ProjectRelationModel
): RelationGraph<ProjectModel> {
    return new RelationGraph(
        projects.sort((a, b) => a.createTime.getTime() - b.createTime.getTime()),
        (element: ProjectModel) => element.id,
        (builder) => {
            for (const project of projects) {
                const relations = project.id === thisProject.id ? newRelations : project.relations
                for (const relationType of RELATION_TYPE_VALUES) {
                    const list = relations[relationType]
                    if (Array.isArray(list)) {
                        for (const relatedId of list) {
                            const relatedProject = projects.find(p => p.id === relatedId)
                            if (relatedProject) {
                                builder.addRelation(project, relationType, relatedProject, (e: ProjectModel) => e.id)
                            }
                        }
                    }
                }
            }
        }
    )
}

/**
 * 构建关系传播图（用于全部项目更新）
 */
function buildRelationGraphForAll(projects: ProjectModel[]): RelationGraph<ProjectModel> {
    return new RelationGraph(
        projects.sort((a, b) => a.createTime.getTime() - b.createTime.getTime()),
        (element: ProjectModel) => element.id,
        (builder) => {
            for (const project of projects) {
                for (const relationType of RELATION_TYPE_VALUES) {
                    const list = project.relations[relationType]
                    if (Array.isArray(list)) {
                        for (const relatedId of list) {
                            const relatedProject = projects.find(p => p.id === relatedId)
                            if (relatedProject) {
                                builder.addRelation(project, relationType, relatedProject, (e: ProjectModel) => e.id)
                            }
                        }
                    }
                }
            }
        }
    )
}

/**
 * 构建关系传播图（用于移除项目）
 */
function buildRelationGraphForRemoval(
    projects: ProjectModel[],
    projectIdToRemove: string,
    relationChanges: Map<string, ProjectRelationModel>
): RelationGraph<ProjectModel> {
    return new RelationGraph(
        projects.sort((a, b) => a.createTime.getTime() - b.createTime.getTime()),
        (element: ProjectModel) => element.id,
        (builder) => {
            for (const project of projects) {
                const newRelations = findAndRemoveIdInRelation(project.relations, projectIdToRemove)
                if (newRelations) {
                    relationChanges.set(project.id, newRelations)
                }
                const relations = newRelations || project.relations
                for (const relationType of RELATION_TYPE_VALUES) {
                    const list = relations[relationType]
                    if (Array.isArray(list)) {
                        for (const relatedId of list) {
                            const relatedProject = projects.find(p => p.id === relatedId)
                            if (relatedProject) {
                                builder.addRelation(project, relationType, relatedProject, (e: ProjectModel) => e.id)
                            }
                        }
                    }
                }
            }
        }
    )
}

/**
 * 将 RelationType 拓扑转换为字符串拓扑
 */
function convertTopologyToStrings(topology: Record<RelationType, ProjectModel[]>): ProjectRelationModel {
    const result: ProjectRelationModel = {} as ProjectRelationModel
    for (const relationType of RELATION_TYPE_VALUES) {
        if (topology[relationType]) {
            result[relationType] = topology[relationType].map(p => p.id)
        }
    }
    return result
}

// 添加类型定义
type ProjectModel = {
    id: string
    relations: ProjectRelationModel
    relationsTopology: ProjectRelationModel
    createTime: Date
}