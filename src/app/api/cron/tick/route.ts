import { NextRequest, NextResponse } from "next/server"
import { cronTick } from "@/services/project-cron"
import config from "@/config/config"

/** 供宿主机 reel-hub-cron.sh / 任意受信客户端调用的定时任务入口；生产环境请设置 SYSCALL_SECRET */
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

  const result = await cronTick()
  if(!result.ok) {
    return NextResponse.json({ ok: false, error: result.err.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
