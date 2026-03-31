import { ShoppingType } from "@/prisma/generated"
import { SelectItem } from "./general"

export const SHOPPING_TYPE_LABEL: Record<ShoppingType, string> = {
    [ShoppingType.MAIN]: "本体",
    [ShoppingType.DLC]: "DLC",
    [ShoppingType.IN_APP_PURCHASE]: "内购",
    [ShoppingType.SUBSCRIPTION]: "订阅",
    [ShoppingType.OTHER]: "其他"
}

export const SHOPPING_TYPE_SELECT_ITEMS: SelectItem<ShoppingType>[] = [
    { label: "本体", value: ShoppingType.MAIN, color: "blue" },
    { label: "DLC", value: ShoppingType.DLC, color: "cyan" },
    { label: "内购", value: ShoppingType.IN_APP_PURCHASE, color: "purple" },
    { label: "订阅", value: ShoppingType.SUBSCRIPTION, color: "orange" },
    { label: "其他", value: ShoppingType.OTHER, color: "gray" }
]
