

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