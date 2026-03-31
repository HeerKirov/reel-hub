import { Metadata } from "next"
import { PurchaseList, type PurchaseListSearchParams } from "@/components/app/purchase-list"

export const metadata: Metadata = {
    title: "消费记录"
}

export default async function GamePurchase(props: { searchParams: Promise<PurchaseListSearchParams> }) {
    return <PurchaseList searchParams={props.searchParams} />
}