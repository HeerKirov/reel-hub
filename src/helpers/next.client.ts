"use client"

import { Session } from "next-auth"
import { useSession } from "next-auth/react"
import { checkPermission } from "@/helpers/permission"

export function hasPermission(permissionName: string, args?: Record<string, unknown> | null, session?: Session | null): boolean {
    return checkPermission(session?.user?.permissions, permissionName, args)
}

export function useHasPermission(permissionName: string, args?: Record<string, unknown> | null): boolean {
    const { data: session } = useSession()
    return hasPermission(permissionName, args, session)
}
