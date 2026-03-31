import { Metadata } from "next"
import { retrieveProjectGame } from "@/services/project-game"
import PurchaseDetail from "@/components/app/purchase-detail"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const project = await retrieveProjectGame(id)
    if(!project) {
        return { title: "404 Not Found" }
    }
    return { title: project.title || "(未命名)" }
}

export default async function GamePurchaseProjectDetail(props: {params: Promise<{ id: string }>, searchParams: Promise<{ page?: string }>}) {
    const { id } = await props.params
    return <PurchaseDetail id={id} searchParams={props.searchParams} />
}
