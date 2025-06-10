import { BoardcastType, OriginalType } from "@/prisma/generated"
import { arrays } from "@/helpers/primitive"
import { SelectItem } from "./general"

export { BoardcastType, OriginalType }

export const ORIGINAL_TYPE = [OriginalType.GAME, OriginalType.MANGA, OriginalType.NOVEL, OriginalType.ORIGINAL, OriginalType.OTHER] as const

export const BOARDCAST_TYPE = [BoardcastType.MOVIE, BoardcastType.OTHER, BoardcastType.OVA_AND_OAD, BoardcastType.TV_AND_WEB] as const

export const BOARDCAST_TYPE_ITEMS: SelectItem<BoardcastType>[] = [
    {label: "TV&web动画", value: BoardcastType.TV_AND_WEB, color: "cyan"},
    {label: "剧场版动画", value: BoardcastType.MOVIE, color: "blue"},
    {label: "OVA & OAD", value: BoardcastType.OVA_AND_OAD, color: "orange"},
    {label: "其他", value: BoardcastType.OTHER, color: "purple"}
]

export const ORIGINAL_TYPE_ITEMS: SelectItem<OriginalType>[] = [
    {label: "原创", value: OriginalType.ORIGINAL, color: "orange"},
    {label: "漫画改编", value: OriginalType.MANGA, color: "pink"},
    {label: "小说改编", value: OriginalType.NOVEL, color: "cyan"},
    {label: "游戏改编", value: OriginalType.GAME, color: "green"},
    {label: "其他", value: OriginalType.OTHER, color: "purple"}
]

export const VALUE_TO_ORIGINAL_TYPE = arrays.associateBy(ORIGINAL_TYPE_ITEMS, i => i.value)

export const VALUE_TO_BOARDCAST_TYPE = arrays.associateBy(BOARDCAST_TYPE_ITEMS, i => i.value)