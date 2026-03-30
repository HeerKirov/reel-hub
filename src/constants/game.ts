import { OnlineType } from "@/prisma/generated"
import { arrays } from "@/helpers/primitive"
import { SelectItem } from "./general"

export type Platform = "pc" | "ios" | "android" | "switch" | "xbox" | "ps" | "other"

export const PLATFORM = ["pc", "ios", "android", "switch", "xbox", "ps", "other"] as const

export const ONLINE_TYPE = [OnlineType.SINGLE_PLAYER, OnlineType.MULTI_PLAYER, OnlineType.ONLINE_GAME] as const

export const PLATFORM_ITEMS: SelectItem<Platform>[] = [
    {label: "PC", value: "pc", color: "cyan"},
    {label: "iOS", value: "ios", color: "pink"},
    {label: "Android", value: "android", color: "teal"},
    {label: "Switch", value: "switch", color: "red"},
    {label: "Xbox", value: "xbox", color: "green"},
    {label: "PlayStation", value: "ps", color: "blue"},
    {label: "其他", value: "other", color: "gray"},
]

export const ONLINE_TYPE_ITEMS: SelectItem<OnlineType>[] = [
    {label: "单机游戏", value: OnlineType.SINGLE_PLAYER, color: "green"},
    {label: "联机游戏", value: OnlineType.MULTI_PLAYER, color: "orange"},
    {label: "在线游戏", value: OnlineType.ONLINE_GAME, color: "blue"},
]

export const VALUE_TO_ONLINE_TYPE = arrays.associateBy(ONLINE_TYPE_ITEMS, i => i.value)

export const VALUE_TO_PLATFORM = arrays.associateBy(PLATFORM_ITEMS, i => i.value)