"use server"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"
import { ProjectType } from "@/constants/project"
import { MovieForm, MovieListFilter, MovieDetailSchema, MovieListSchema, parseMovieDetailSchema, parseMovieListSchema, movieForm, movieListFilter } from "@/schemas/project-movie"

const movieProjectKind: ProjectCrudKind<MovieListFilter, MovieForm, MovieListSchema, MovieDetailSchema> = {
    type: ProjectType.MOVIE,
    listFilterSchema: movieListFilter,
    formSchema: movieForm,
    listExtraWhere: _ => ({}),
    toListItem: parseMovieListSchema,
    toDetail: parseMovieDetailSchema,
    buildCreateExtras: _ => ({}),
    buildUpdateExtras: _ => ({})
}

export const {
    list: listProjectMovie,
    retrieve: retrieveProjectMovie,
    create: createProjectMovie,
    update: updateProjectMovie,
    delete: deleteProjectMovie
} = createProjectCrudApi(movieProjectKind)

