import { arrays } from "@/helpers/primitive"
import { BoardcastType, OriginalType, ProjectType } from "@/prisma/generated"
import { SelectItemWithDesc, SelectItem } from "./general"

export { ProjectType }

export type RatingSex = "all" | "r12" | "r15" | "r17" | "r18"

export type RatingViolence = "no" | "a" | "b" | "c" | "d"

export type Region = "jp" | "us" | "cn" | "kr" | "other"

export const RATING_SEX = ["all", "r12", "r15", "r17", "r18"] as const

export const RATING_VIOLENCE = ["no", "a", "b", "c", "d"] as const

export const REGION = ["jp", "us", "cn", "kr", "other"] as const

export const PROJECT_TYPE = [ProjectType.ANIME, ProjectType.GAME, ProjectType.MANGA, ProjectType.MOVIE, ProjectType.NOVEL] as const

export const RATING_SEX_ITEMS: SelectItemWithDesc<RatingSex>[] = [
    {label: "全年龄", value: "all", color: "green", desc: ["无任何性暗示、性倾向、色情内容", "没有任何性暗示倾向的恋爱、接触、轻微裸露行为不会视作限制内容", "可以较为放心地提供给家长和儿童观看"]},
    {label: "R12", value: "r12", color: "cyan", desc: ["有一定的软色情性质的性暗示或低俗内容", "性相关的讨论、轻微的色情内容、轻微的裸露、稍显低俗的内容", "不能放心地提供给家长和儿童观看"]},
    {label: "R15", value: "r15", color: "purple", desc: ["存在明显色情意向的低俗内容或性暗示", "色情话题的讨论、色情裸露、低俗内容", "不要提供给家长和儿童观看，会被打死"]},
    {label: "R17", value: "r17", color: "orange", desc: ["具有强烈的色情意向或露骨的性展示", "性动作暗示、大面积的色情裸露", "公开放送容易引起社会性死亡"]},
    {label: "R18", value: "r18", color: "red", desc: ["以性内容为直接卖点的色情内容", "露点、性行为、性话题的直接讨论", "公开讨论容易引起社会性死亡"]}
]

export const RATING_VIOLENCE_ITEMS: SelectItemWithDesc<RatingViolence>[] = [
    {label: "无限制", value: "no", color: "green", desc: ["无任何暴力、冲突和不当行为", "不涉及冲突和暴力行为的日常类内容，但日常冲突不包括在内", "适合不接受打斗和冲突的所有人"]},
    {label: "A", value: "a", color: "cyan", desc: ["适合青少年、不具有不当行为的暴力或冲突", "普通且广泛的战斗要素、轻微且常见的日常暴力冲突", "适合接受打斗和冲突的所有人"]},
    {label: "B", value: "b", color: "purple", desc: ["存在一定的暴力、不当行为、价值观扭曲", "暴力倾向、轻度凶杀、轻度猎奇和黑暗倾向", "不适合所有人，但普及面仍然广"]},
    {label: "C", value: "c", color: "orange", desc: ["存在较重的暴力、凶杀、其他不当行为", "较重的血腥内容、重度暴力倾向、凶杀和残杀、猎奇和惊悚恐吓内容", "不适合所有人，但普及面仍然广"]},
    {label: "D", value: "d", color: "red", desc: ["存在严重引起生理或心理不适，严重影响三观的内容", "重度的血腥、暴力和凶杀，强烈的猎奇内容，容易留下心理阴影的内容", "不适合所有人，但普及面仍然广"]}
]

export const REGION_ITEMS: SelectItem<Region>[] = [
    {label: "日本", value: "jp", color: "orange"},
    {label: "美国", value: "us", color: "blue"},
    {label: "中国", value: "cn", color: "red"},
    {label: "韩国", value: "kr", color: "cyan"},
    {label: "其他", value: "other", color: "purple"}
]

export const RATING_SEX_TO_INDEX = arrays.associate(RATING_SEX_ITEMS.map((i, index) => ({index, value: i.value})), ({ value }) => value, ({ index }) => index)

export const RATING_VIOLENCE_TO_INDEX = arrays.associate(RATING_VIOLENCE_ITEMS.map((i, index) => ({index, value: i.value})), ({ value }) => value, ({ index }) => index)

export const VALUE_TO_RATING_SEX = arrays.associateBy(RATING_SEX_ITEMS, i => i.value)

export const VALUE_TO_RATING_VIOLENCE = arrays.associateBy(RATING_VIOLENCE_ITEMS, i => i.value)

export const VALUE_TO_REGION = arrays.associateBy(REGION_ITEMS, i => i.value)

// RelationType 定义
export type RelationType = "PREV" | "NEXT" | "FANWAI" | "MAIN_ARTICLE" | "RUMOR" | "TRUE_PASS" | "SERIES"

export const RELATION_TYPE_NAMES: Record<RelationType, string> = {
    PREV: "前作",
    NEXT: "续作",
    FANWAI: "番外",
    MAIN_ARTICLE: "正篇",
    RUMOR: "外传",
    TRUE_PASS: "正传",
    SERIES: "同系列"
}

// RelationType 的级别定义
export const RELATION_TYPE_LEVELS: Record<RelationType, number> = {
    PREV: 4,
    NEXT: 4,
    FANWAI: 3,
    MAIN_ARTICLE: 3,
    RUMOR: 2,
    TRUE_PASS: 2,
    SERIES: 1
}

// RelationType 的反向关系
export const RELATION_TYPE_REVERSE: Record<RelationType, RelationType> = {
    PREV: "NEXT",
    NEXT: "PREV",
    FANWAI: "MAIN_ARTICLE",
    MAIN_ARTICLE: "FANWAI",
    RUMOR: "TRUE_PASS",
    TRUE_PASS: "RUMOR",
    SERIES: "SERIES"
}

// RelationType 的合并规则
export function mergeRelationTypes(a: RelationType, b: RelationType): RelationType {
    if (a === b) return a
    if (a === "SERIES" || b === "SERIES" || RELATION_TYPE_LEVELS[a] === RELATION_TYPE_LEVELS[b]) {
        return "SERIES"
    }
    if (a === "RUMOR" || b === "RUMOR") return "RUMOR"
    if (a === "TRUE_PASS" || b === "TRUE_PASS") return "TRUE_PASS"
    if (a === "PREV" || b === "PREV") return "PREV"
    if (a === "NEXT" || b === "NEXT") return "NEXT"
    
    throw new Error("This case may not occurred.")
}

// 字符串转 RelationType 的辅助函数
export function stringToRelationType(str: string): RelationType {
    const upperStr = str.toUpperCase()
    if (upperStr === "PREV" || upperStr === "NEXT" || upperStr === "FANWAI" || 
        upperStr === "MAIN_ARTICLE" || upperStr === "RUMOR" || upperStr === "TRUE_PASS" || upperStr === "SERIES") {
        return upperStr as RelationType
    }
    throw new Error(`Invalid relation type: ${str}`)
}

// 获取所有 RelationType 值的数组
export const RELATION_TYPE_VALUES: RelationType[] = ["PREV", "NEXT", "FANWAI", "MAIN_ARTICLE", "RUMOR", "TRUE_PASS", "SERIES"]

