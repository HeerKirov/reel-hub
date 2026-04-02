import { NextRequest, NextResponse } from "next/server"
import { migrateLegacyByToken } from "@/services/legacy"
import config from "@/config/config"

interface MigrateRequestBody {
    oldDatabaseUrl?: string
    userMapping?: Record<string, string>
    dryRun?: boolean
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const secret = config.AUTH.SYSCALL_SECRET
    if (!secret) {
        return NextResponse.json({ ok: false, error: "SYSCALL_SECRET is not set" }, { status: 503 })
    }
    const auth = request.headers.get("authorization")
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
    if (token !== secret) {
        return NextResponse.json({ ok: false }, { status: 401 })
    }
    const body = await request.json().catch(() => ({})) as MigrateRequestBody
    if(!body.oldDatabaseUrl) {
        return NextResponse.json({ ok: false, error: "oldDatabaseUrl is required" }, { status: 400 })
    }
    if(!body.userMapping || typeof body.userMapping !== "object" || Array.isArray(body.userMapping)) {
        return NextResponse.json({ ok: false, error: "userMapping is required" }, { status: 400 })
    }
    const result = await migrateLegacyByToken(body.oldDatabaseUrl, body.userMapping, body.dryRun === true)
    if(!result.ok) {
        return NextResponse.json({ ok: false, error: result.err.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, result: result.value })
}
