import { BoardcastType } from "@/constants/anime"
import { FollowType, RecordStatus } from "@/constants/record"


/**
 * 将publishTime计算为它所在的季度，并转换至query结构。
 */
export function getPublishTimeRange(publishTime: string): {gte?: string, lte?: string} {
    const [year, month] = publishTime.split("-")
    if (!month) {
        return {
            gte: `${year}-01`,
            lte: `${year}-12`
        }
    }
    const monthNum = parseInt(month)
    const quarterStart = Math.floor((monthNum - 1) / 3) * 3 + 1
    return {
        gte: `${year}-${quarterStart.toString().padStart(2, "0")}`,
        lte: `${year}-${(quarterStart + 2).toString().padStart(2, "0")}`
    }
}

/**
 * 根据进度状态计算追番类型。
 */
export function getFollowType(ordinal: number, boardcastType: BoardcastType | null, publishTime: string | null, startTime: Date | null): FollowType {
    if(ordinal > 1) return FollowType.REWATCH
    if(boardcastType !== "TV_AND_WEB" || !publishTime || !startTime) return FollowType.CATCH_UP

    const [year, month] = publishTime.split("-").map(Number)
    const endDate = new Date(year, Math.floor((month - 1) / 3) * 3 + 3, 1)

    return startTime < endDate ? FollowType.FOLLOW : FollowType.CATCH_UP
}

/**
 * 根据进度状态计算记录状态。
 */
export function getRecordStatus(progressCount: number, endTime: Date | null, episodeTotalNum: number | null, episodeWatchedNum: number | null): RecordStatus {
    if(progressCount === 0) return RecordStatus.ON_HOLD
    else if(episodeTotalNum !== null && (episodeWatchedNum ?? 0) >= episodeTotalNum!) return RecordStatus.COMPLETED
    else if(endTime !== null) return RecordStatus.COMPLETED
    else return RecordStatus.WATCHING
}