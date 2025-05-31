import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name: string
            permissions: Permission[]
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        name: string
        permissions: Permission[]
    }
}

interface Permission {
    name: string
    args: Record<string, unknown>
}