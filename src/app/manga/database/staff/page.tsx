import { Metadata } from "next"
import { StaffList, StaffListSearchParams } from "@/components/app/staff-list"
import { ProjectType } from "@/constants/project"

export const metadata: Metadata = {
    title: "STAFF"
}

export default async function MangaDatabaseStaff(props: { searchParams: Promise<StaffListSearchParams> }) {
    return <StaffList searchParams={props.searchParams} type={ProjectType.MANGA} />
}

