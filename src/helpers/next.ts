import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/config/auth"

export async function getSession() {
    return await getServerSession(authOptions)
}

export async function hasPermission(permissionName: string, args?: Record<string, unknown> | null, session?: Session | null) {
    const currentSession = session !== undefined ? session : await getSession()
    if(currentSession?.user) {
        const permission = currentSession.user.permissions.find(p => p.name === permissionName)
        if(permission) {
            if(args) {
                for(const [key, value] of Object.entries(args)) {
                    if(permission.args[key] !== value) {
                        return false
                    }
                }
            }
            return true
        }
    }
    return false
}