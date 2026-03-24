export interface Permission {
    name: string
    args: Record<string, unknown>
}

export function checkPermission(permissions: Permission[] | undefined, permissionName: string, args?: Record<string, unknown> | null): boolean {
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
