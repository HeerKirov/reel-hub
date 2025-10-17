import { nanoid } from "nanoid"
import { getUserId } from "@/helpers/next"
import { deleteFile, existFile, uploadFile } from "@/lib/oss"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
    const form = await request.formData()
    const projectId = form.get("projectId") as string
    const userId = await getUserId()
    const now = new Date()
    const record = await prisma.project.findUnique({where: {id: projectId}})
    if(!record) return NextResponse.json({ok: false}, {status: 404})
    const resources = record.resources as Record<string, string>
    let changed = false
    
    if(form.has("avatar")) {
        const f = form.get("avatar") as File
        if(!f.type || !f.type.startsWith("image/")) {
            return NextResponse.json({ok: false, error: "Only image file is supported."}, {status: 400})
        }
        const ext = f.type.split("/")[1]
        const objectName = `${projectId}-${nanoid()}.${ext}`
        await uploadFile(`avatar/${objectName}`, Buffer.from(await f.arrayBuffer()), {})
        
        resources["avatar"] = `avatar/${objectName}`
        changed = true

        if(resources["avatar"] !== null && await existFile(`avatar/${resources["avatar"]}`)) {
            await deleteFile(`avatar/${resources["avatar"]}`)
        }
    }

    if(form.has("cover")) {
        const f = form.get("cover") as File
        if(!f.type || !f.type.startsWith("image/")) {
            return NextResponse.json({ok: false, error: "Only image file is supported."}, {status: 400})
        }
        const ext = f.type.split("/")[1]
        const objectName = `${projectId}-${nanoid()}.${ext}`
        await uploadFile(`cover/${objectName}`, Buffer.from(await f.arrayBuffer()), {})

        resources["cover"] = `cover/${objectName}`
        changed = true

        if(resources["cover"] !== null && await existFile(`cover/${resources["cover"]}`)) {
            await deleteFile(`cover/${resources["cover"]}`)
        }
    }

    if(changed) {
        await prisma.project.update({where: {id: projectId}, data: {resources: resources, updateTime: now, updator: userId}})
        return NextResponse.json({ok: true}, {status: 200})
    }
    return NextResponse.json({ok: false}, {status: 200})
}