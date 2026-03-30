import { Metadata } from "next"
import { RecordList, RecordListSearchParams } from "@/components/app/record-list"
import { ProjectType } from "@/constants/project"

export const metadata: Metadata = {
    title: "记录"
}

export default async function NovelRecord(props: { searchParams: Promise<RecordListSearchParams> }) {
    return <RecordList searchParams={props.searchParams} type={ProjectType.NOVEL} />
}

