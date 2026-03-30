import { Metadata } from "next"
import { StaffDetail } from "@/components/app/staff-detail"
import { InlineError, NotFoundScreen } from "@/components/app/inline-error"
import { NavigationBreadcrumb } from "@/components/server/layout"
import { unwrapQueryResult } from "@/helpers/result"
import { listProjectGame } from "@/services/project-game"
import { retrieveStaff } from "@/services/staff"
import { hasPermission } from "@/helpers/next"
import { ProjectType } from "@/constants/project"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const staff = await retrieveStaff(Number(id))
    if(!staff) return { title: "404 Not Found" }
    return { title: staff.name }
}

export default async function GameDatabaseStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const staffId = Number(id)
    if(Number.isNaN(staffId)) return <NotFoundScreen />

    const staff = await retrieveStaff(staffId)
    if(!staff) return <NotFoundScreen />

    const listResult = await listProjectGame({ page: 1, size: 9, staff: staff.name })
    const { data, error } = unwrapQueryResult(listResult)

    if(error) return <InlineError error={error} />

    const isAdmin = await hasPermission("admin")

    return (
        <>
            <NavigationBreadcrumb url="/game/database" detail={staff.name} />
            <StaffDetail data={staff} related={data.list} isAdmin={isAdmin} type={ProjectType.GAME} />
        </>
    )
}
