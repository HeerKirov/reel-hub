import { Box } from "@chakra-ui/react"
import { NavigationBreadcrumb } from "@/components/server/layout"

export default async function AnimationDatabaseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (<>
        <NavigationBreadcrumb url="/anime/database" detail={id}/>

        <Box>
            {id}
        </Box>
    </>)
}