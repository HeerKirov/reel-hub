import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            name: string
            permissions: Permission[]
        } & DefaultSession["user"]
    }

    interface User {
        name: string
        permissions: Permission[]
    }
}

interface Permission {
    name: string
    args: Record<string, unknown>
}