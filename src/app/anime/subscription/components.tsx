"use client"

import { memo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Link } from "@chakra-ui/react"
import { RiFlightTakeoffLine } from "react-icons/ri"
import { nextEpisode } from "@/services/record-progress"
import { handleActionResult } from "@/helpers/action"

export const SubscriptionAnimeRowNextButton = memo(function SubscriptionAnimeRowNextButton({ projectId, watched }: { projectId: string, watched: number }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const nextClick = useCallback(async () => {
        if(isLoading) return
        setIsLoading(true)
        const result = handleActionResult(await nextEpisode(projectId))
        if(result.ok) router.refresh()
        // setIsLoading(false)
    }, [router, projectId, isLoading])

    return (
        <Link fontSize="sm" color="fg.muted" fontWeight="bold" onClick={nextClick} aria-disabled={isLoading} opacity={isLoading ? 0.6 : 1}>
            <RiFlightTakeoffLine />
            NEXT 第 {watched + 1} 话
        </Link>
    )
})
