import { getServerSession } from "next-auth"
import { authOptions } from "@/config/auth"

export async function getSession() {
    return await getServerSession(authOptions)
}