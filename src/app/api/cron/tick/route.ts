import { NextRequest, NextResponse } from "next/server"

/** 供宿主机 reel-hub-cron.sh / 任意受信客户端调用的定时任务入口；生产环境请设置 CRON_SECRET */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not set" }, { status: 503 })
  }
  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (token !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
