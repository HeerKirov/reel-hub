"use server"
import { ProjectType } from "@/constants/project"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"
import { MangaDetailSchema, MangaForm, MangaListFilter, MangaListSchema, parseMangaDetailSchema, parseMangaListSchema, mangaForm, mangaListFilter } from "@/schemas/project-manga"

const mangaProjectKind: ProjectCrudKind<MangaListFilter, MangaForm, MangaListSchema, MangaDetailSchema> = {
    type: ProjectType.MANGA,
    listFilterSchema: mangaListFilter,
    formSchema: mangaForm,
    listExtraWhere: _ => ({}),
    toListItem: parseMangaListSchema,
    toDetail: parseMangaDetailSchema,
    buildCreateExtras: _ => ({}),
    buildUpdateExtras: _ => ({})
}

export const {
    list: listProjectManga,
    retrieve: retrieveProjectManga,
    create: createProjectManga,
    update: updateProjectManga,
    delete: deleteProjectManga
} = createProjectCrudApi(mangaProjectKind)

