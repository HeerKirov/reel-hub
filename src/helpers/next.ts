import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/config/auth"
import { checkPermission } from "@/helpers/permission"
import { exceptionUnauthorized } from "@/constants/exception"

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