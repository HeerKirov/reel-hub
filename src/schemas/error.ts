import type { AlreadyExists, InternalServerError, NotFound, ParamError, ParamRequired, Reject, RejectCreateProgress, RejectNextEpisode, ResourceNotExist } from "@/constants/exception"

// --- project ---

export type ListProjectError = ParamError | InternalServerError

export type CreateProjectError =
  | ParamError
  | CreateTagError
  | CreateStaffError
  | UpdateRelationsError
  | InternalServerError

export type UpdateProjectError =
  | ParamError
  | NotFound
  | CreateTagError
  | CreateStaffError
  | UpdateRelationsError
  | InternalServerError

export type DeleteProjectError =
  | NotFound
  | RemoveProjectInTopologyError
  | InternalServerError

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

export type CreateTagError = ParamError | AlreadyExists<"tag", "name", string> | NotFound | InternalServerError

export type UpdateTagError = ParamError | AlreadyExists<"tag", "name", string> | NotFound | InternalServerError

export type DeleteTagError = NotFound | InternalServerError

// --- staff ---

export type ListStaffsError = ParamError | InternalServerError

export type CreateStaffError = ParamError | AlreadyExists<"staff", "name", string> | InternalServerError

export type UpdateStaffError = ParamError | AlreadyExists<"staff", "name", string> | NotFound | InternalServerError

export type DeleteStaffError = NotFound | InternalServerError

// --- staff type ---

export type ListStaffTypesError = ParamError | InternalServerError

// --- user preference ---

export type GetUserPreferenceError = InternalServerError
export type SetUserPreferenceError = ParamError | InternalServerError
