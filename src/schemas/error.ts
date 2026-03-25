import type { AlreadyExists, InternalServerError, NotFound, ParamError, ParamRequired, Reject, RejectCreateProgress, RejectNextEpisode, ResourceNotExist } from "@/constants/exception"

// --- project ---

export type ListProjectError = ParamError | InternalServerError

export type UpdateRelationsError =
  | ParamError
  | NotFound
  | ResourceNotExist<"projectIds", string>
  | InternalServerError

export type UpdateAllRelationTopologyError = InternalServerError

export type RemoveProjectInTopologyError = ResourceNotExist<"projectIds", string> | InternalServerError

/** `project` 内 `findAll` 的 Result 错误，与拓扑中的 `projectIds` 缺失一致 */
export type ProjectFindAllError = ResourceNotExist<"projectIds", string>

// --- record ---

export type RecordPreviewError = NotFound | InternalServerError

export type RecordDetailError = NotFound | InternalServerError

export type CreateRecordError =
  | ParamError
  | ParamRequired
  | NotFound
  | AlreadyExists<"record", "projectId", string>
  | RejectCreateProgress
  | InternalServerError

export type UpdateRecordError = ParamError | NotFound | InternalServerError

export type DeleteRecordError = NotFound | InternalServerError
export type ListRecordError = ParamError | InternalServerError

export type CreateProgressError =
  | ParamError
  | ParamRequired
  | NotFound
  | RejectCreateProgress
  | InternalServerError

export type UpdateLatestProgressError =
  | ParamError
  | ParamRequired
  | NotFound
  | Reject
  | InternalServerError

export type NextEpisodeError =
  | NotFound
  | Reject
  | RejectNextEpisode
  | InternalServerError

export type DeleteProgressError =
  | NotFound
  | InternalServerError

// --- comment ---

export type ListCommentsError = ParamError | InternalServerError

export type RetrieveCommentError = InternalServerError

export type UpsertCommentError =
  | ParamError
  | NotFound
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

export type CreateProjectAnimeError =
  | ParamError
  | CreateTagError
  | CreateStaffError
  | UpdateRelationsError
  | InternalServerError

export type UpdateProjectAnimeError =
  | ParamError
  | NotFound
  | CreateTagError
  | CreateStaffError
  | UpdateRelationsError
  | InternalServerError

export type DeleteProjectAnimeError =
  | NotFound
  | RemoveProjectInTopologyError
  | InternalServerError
