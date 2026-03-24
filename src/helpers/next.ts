import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/config/auth"
import { checkPermission } from "@/helpers/permission"

export async function getSession() {
    return await getServerSession(authOptions)
}

export async function getUserIdOrNull(): Promise<string | null> {
    const session = await getSession()
    return session?.user.id ?? null
}

export async function getUserId(): Promise<string> {
    const userId = await getUserIdOrNull()
    if(userId !== null) return userId
    throw new Error("Unauthorized.")
}

export async function hasPermission(permissionName: string, args?: Record<string, unknown> | null, session?: Session | null) {
    const currentSession = session !== undefined ? session : await getSession()
    return checkPermission(currentSession?.user?.permissions, permissionName, args)
}