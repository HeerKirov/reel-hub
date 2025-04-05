import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            permissions: Permission[]
        } & DefaultSession["user"]
    }

    interface User {
        permissions: Permission[]
    }
}

interface Permission {
    name: string
    args: Record<string, unknown>
}