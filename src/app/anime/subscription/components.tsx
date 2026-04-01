"use client"

import { memo, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Link } from "@chakra-ui/react"
import { RiFlightTakeoffLine } from "react-icons/ri"
import { nextEpisode } from "@/services/record-progress"
import { handleActionResult } from "@/helpers/action"

export const SubscriptionAnimeRowNextButton = memo(function SubscriptionAnimeRowNextButton({ projectId, watched }: { projectId: string, watched: number }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const nextClick = useCallback(async () => {
        const result = handleActionResult(await nextEpisode(projectId))
        if(result.ok) startTransition(() => router.refresh())
    }, [router, projectId])

    return (
        <Link fontSize="sm" color="fg.muted" fontWeight="bold" onClick={nextClick} aria-disabled={isPending} opacity={isPending ? 0.6 : 1}>
            <RiFlightTakeoffLine />
            NEXT 第 {watched + 1} 话
        </Link>
    )
})
