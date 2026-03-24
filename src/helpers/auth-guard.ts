import { getSession, hasPermission } from "@/helpers/next"
import { ACCESS_LEVEL, AccessAction, AccessResource, PERMISSIONS, RESOURCE_ACCESS } from "@/constants/permission"
import { exceptionUnauthorized, exceptionForbidden } from "@/constants/exception"

export async function requireAuth() {
    const session = await getSession()
    if(!session?.user) {
        throw exceptionUnauthorized()
    }
    return session
}

export async function requireAdmin() {
    return requirePermission(PERMISSIONS.ADMIN)
}

export async function requirePermission(permissionName: string, args?: Record<string, unknown> | null) {
    const session = await requireAuth()
    const hasRequiredPermission = await hasPermission(permissionName, args, session)
    if(!hasRequiredPermission) {
        throw exceptionForbidden()
    }
    return session
}

export async function requireAccess(resource: AccessResource, action: AccessAction) {
    const required = RESOURCE_ACCESS[resource][action]
    if(required === ACCESS_LEVEL.PUBLIC) return null
    if(required === ACCESS_LEVEL.AUTH) {
        return requireAuth()
    }
    return requirePermission(required)
}
