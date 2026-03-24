export const PERMISSIONS = {
    ADMIN: "admin"
} as const

export const ACCESS_LEVEL = {
    PUBLIC: "public",
    AUTH: "auth"
} as const

export type AccessLevel = typeof ACCESS_LEVEL[keyof typeof ACCESS_LEVEL] | string
export type AccessAction = "read" | "write"
export type AccessResource = "project" | "tag" | "staff" | "record" | "comment"

export const RESOURCE_ACCESS: Record<AccessResource, Record<AccessAction, AccessLevel>> = {
    project: {read: ACCESS_LEVEL.PUBLIC, write: PERMISSIONS.ADMIN},
    tag: {read: ACCESS_LEVEL.PUBLIC, write: PERMISSIONS.ADMIN},
    staff: {read: ACCESS_LEVEL.PUBLIC, write: PERMISSIONS.ADMIN},
    record: {read: ACCESS_LEVEL.AUTH, write: ACCESS_LEVEL.AUTH},
    comment: {read: ACCESS_LEVEL.AUTH, write: ACCESS_LEVEL.AUTH}
}
