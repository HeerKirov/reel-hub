import type { AlreadyExists, InternalServerError, ParamError, ParamRequired, ResourceNotExist, ResourceNotSuitable } from "@/constants/exception"

// --- project ---

export type ListProjectError = ParamError | InternalServerError

/** `saveTags` 仅在创建新标签失败时返回（内部将 `createTag` 的失败归一为该错误） */
export type SaveTagsError = ResourceNotExist<"tagIds", string>

/** `saveStaffs` 仅在创建新 staff 失败时返回 */
export type SaveStaffsError = ResourceNotExist<"staffIds", string>

export type UpdateRelationsError =
  | ParamError
  | ResourceNotExist<"projectId", string>
  | ResourceNotExist<"projectIds", string>
  | InternalServerError

export type UpdateAllRelationTopologyError = InternalServerError

export type RemoveProjectInTopologyError = ResourceNotExist<"projectIds", string> | InternalServerError

/** `project` 内 `findAll` 的 Result 错误，与拓扑中的 `projectIds` 缺失一致 */
export type ProjectFindAllError = ResourceNotExist<"projectIds", string>

// --- record ---

export type RecordPreviewError = ResourceNotExist<"projectId", string> | InternalServerError

export type RecordDetailError = ResourceNotExist<"projectId", string> | InternalServerError

export type CreateRecordError =
  | ParamError
  | ParamRequired
  | ResourceNotExist<"projectId", string>
  | AlreadyExists<"record", "projectId", string>
  | ResourceNotSuitable<"episodePublishedNum" | "latestProgress", string>
  | InternalServerError

export type UpdateRecordError = ParamError | ResourceNotExist<"recordId", string> | InternalServerError

export type DeleteRecordError = ResourceNotExist<"recordId", string> | InternalServerError

export type CreateProgressError =
  | ParamError
  | ParamRequired
  | ResourceNotExist<"projectId" | "recordId", string>
  | ResourceNotSuitable<"episodePublishedNum" | "latestProgress", string>
  | InternalServerError

export type UpdateLatestProgressError =
  | ParamError
  | ParamRequired
  | ResourceNotExist<"projectId" | "recordId", string>
  | ResourceNotExist<"progressOrdinal", number>
  | InternalServerError

export type NextEpisodeError =
  | ResourceNotExist<"projectId", string>
  | ResourceNotExist<"recordId", string>
  | ResourceNotExist<"nextEpisode", string>
  | ResourceNotExist<"progressOrdinal", number>
  | ResourceNotSuitable<"projectType", string>
  | InternalServerError

export type DeleteProgressError =
  | ResourceNotExist<"projectId" | "recordId", string>
  | ResourceNotExist<"progressOrdinal", number>
  | InternalServerError

// --- comment ---

export type ListCommentsError = ParamError | InternalServerError

export type CountCommentsError = ParamError | InternalServerError

export type RetrieveCommentError = InternalServerError

export type UpsertCommentError =
  | ParamError
  | ResourceNotExist<"projectId", string>
  | InternalServerError

export type DeleteCommentError = InternalServerError

// --- tag ---

export type ListTagsError = ParamError | InternalServerError

export type CreateTagError = ParamError | InternalServerError

export type UpdateTagError = ParamError | InternalServerError

export type DeleteTagError = InternalServerError

// --- staff ---

export type ListStaffsError = ParamError | InternalServerError

export type CreateStaffError = ParamError | InternalServerError

export type UpdateStaffError = ParamError | InternalServerError

export type DeleteStaffError = InternalServerError

// --- anime ---

export type ListProjectAnimeError = ParamError | InternalServerError

export type CountProjectAnimeError = ParamError | InternalServerError

export type CreateProjectAnimeError =
  | ParamError
  | SaveTagsError
  | SaveStaffsError
  | UpdateRelationsError
  | InternalServerError

export type UpdateProjectAnimeError =
  | ParamError
  | ResourceNotExist<"projectId", string>
  | SaveTagsError
  | SaveStaffsError
  | UpdateRelationsError
  | InternalServerError

export type DeleteProjectAnimeError =
  | ResourceNotExist<"projectId", string>
  | RemoveProjectInTopologyError
  | InternalServerError
