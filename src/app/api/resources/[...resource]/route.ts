import { NextRequest } from "next/server"
import { getSignedUrl } from "@/lib/oss"

export async function GET(_: NextRequest, { params }: { params: Promise<{ resource: string[] }> }) {
    try {
        const { resource } = await params
        const resourcePath = resource.join("/")
        const signedUrl = await getSignedUrl(resourcePath)
        return Response.redirect(signedUrl)
    } catch (error) {
        console.error("Error getting resource:", error)
        return new Response("Resource not found", { status: 404 })
    }
}
