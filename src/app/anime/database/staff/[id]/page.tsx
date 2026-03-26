import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StaffDetail } from "@/components/app/staff-detail"
import { InlineError } from "@/components/app/inline-error"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { unwrapQueryResult } from "@/helpers/result"
import { listProjectAnime } from "@/services/project-anime"
import { retrieveStaff } from "@/services/staff"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const staff = await retrieveStaff(Number(id))
    if(!staff) return { title: "404 Not Found" }
    return { title: staff.name }
}

export default async function AnimeDatabaseStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const staffId = Number(id)
    if(Number.isNaN(staffId)) notFound()

    const staff = await retrieveStaff(staffId)
    if(!staff) notFound()

    const listResult = await listProjectAnime({ page: 1, size: 9, staff: staff.name })
    const { data, error } = unwrapQueryResult(listResult)

    return (
        <>
            <NavigationBreadcrumb url="/anime/database" detail={staff.name} />
            {error
                ? <InlineError error={error} />
                : <StaffDetail data={staff} related={data.list} />}
        </>
    )
}
