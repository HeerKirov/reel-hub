import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/config/auth"
import { exceptionUnauthorized } from "@/constants/exception"

interface Permission {
    name: string
    args: Record<string, unknown>
}

function checkPermission(permissions: Permission[] | undefined, permissionName: string, args?: Record<string, unknown> | null): boolean {
    if(!permissions || permissions.length === 0) return false

    const permission = permissions.find(p => p.name === permissionName)
    if(!permission) return false
    if(!args) return true

    for(const [key, value] of Object.entries(args)) {
        if(permission.args[key] !== value) {
            return false
        }
    }

    return true
}

export async function getSession() {
    return await getServerSession(authOptions)
}

export async function getUserIdOrNull(session?: Session | null): Promise<string | null> {
    const currentSession = session !== undefined ? session : await getSession()
    return currentSession?.user.id ?? null
}

export async function getUserId(session?: Session | null): Promise<string> {
    const userId = await getUserIdOrNull(session)
    if(userId !== null) return userId
    throw exceptionUnauthorized()
}

export async function hasPermission(permissionName: string, args?: Record<string, unknown> | null, session?: Session | null) {
    const currentSession = session !== undefined ? session : await getSession()
    return checkPermission(currentSession?.user?.permissions, permissionName, args)
}