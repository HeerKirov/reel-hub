import { OnlineType } from "@/prisma/generated"
import { arrays } from "@/helpers/primitive"
import { SelectItem } from "./general"

export { OnlineType }

export type Platform = "pc" | "mac" | "ios" | "android" | "switch" | "xbox" | "psp" | "psv" | "ps3" | "ps4" | "ps5" | "other"

export const PLATFORM = ["pc", "mac", "ios", "android", "switch", "xbox", "psp", "psv", "ps3", "ps4", "ps5", "other"] as const

export const ONLINE_TYPE = [OnlineType.SINGLE_PLAYER, OnlineType.MULTI_PLAYER, OnlineType.ONLINE_GAME] as const

export const PLATFORM_ITEMS: SelectItem<Platform>[] = [
    {label: "PC", value: "pc", color: "cyan"},
    {label: "Mac", value: "mac", color: "pink"},
    {label: "iOS", value: "ios", color: "pink"},
    {label: "Android", value: "android", color: "teal"},
    {label: "Switch", value: "switch", color: "red"},
    {label: "XBox", value: "xbox", color: "green"},
    {label: "PSP", value: "psp", color: "blue"},
    {label: "PSV", value: "psv", color: "blue"},
    {label: "PS3", value: "ps3", color: "blue"},
    {label: "PS4", value: "ps4", color: "blue"},
    {label: "PS5", value: "ps5", color: "blue"},
    {label: "其他", value: "other", color: "gray"},
]

export const ONLINE_TYPE_ITEMS: SelectItem<OnlineType>[] = [
    {label: "单机游戏", value: OnlineType.SINGLE_PLAYER, color: "green"},
    {label: "联机游戏", value: OnlineType.MULTI_PLAYER, color: "orange"},
    {label: "在线游戏", value: OnlineType.ONLINE_GAME, color: "blue"},
]

export const VALUE_TO_ONLINE_TYPE = arrays.associateBy(ONLINE_TYPE_ITEMS, i => i.value)

export const VALUE_TO_PLATFORM = arrays.associateBy(PLATFORM_ITEMS, i => i.value)