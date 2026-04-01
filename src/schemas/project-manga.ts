import { z } from "zod"
import type { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { episodePublishRecordFormSchema, parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type EpisodePublishRecordModel, type ProjectDetailSchema, type ProjectListSchema, type ProjectRelationSchema, type ProjectModel } from "./project"

export const mangaListFilter = projectListFilter

export const mangaForm = projectCommonForm.extend({
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishedRecords: z.array(episodePublishRecordFormSchema).optional(),
    episodePublishPlan: z.array(episodePublishRecordFormSchema).optional()
})

export type MangaListSchema = ProjectListSchema & {
    episodeTotalNum: number
    episodePublishedNum: number
}

export type MangaDetailSchema = ProjectDetailSchema & {
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecordModel[]
    episodePublishedRecords: EpisodePublishRecordModel[]
}

export function parseMangaListSchema(data: Project): MangaListSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectListSchema(data),
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0
    }
}

export function parseMangaDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): MangaDetailSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectDetailSchema(data, relations, relationsTopology),
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0,
        episodePublishPlan: i.episodePublishPlan ?? [],
        episodePublishedRecords: i.episodePublishedRecords ?? []
    }
}

export type MangaListFilter = z.infer<typeof mangaListFilter>

export type MangaForm = z.infer<typeof mangaForm>

