import { RecordStatus, FollowType } from "@/prisma/generated"
import { SelectItem } from "./general"
import { arrays } from "@/helpers/primitive"

export { RecordStatus, FollowType }

export const RECORD_STATUS = [RecordStatus.WATCHING, RecordStatus.COMPLETED, RecordStatus.ON_HOLD, RecordStatus.DROPPED] as const

export const FOLLOW_TYPE = [FollowType.CATCH_UP, FollowType.FOLLOW, FollowType.REWATCH] as const

export const RECORD_STATUS_ITEMS: SelectItem<RecordStatus>[] = [
    {label: "进行中", value: RecordStatus.WATCHING, color: "cyan"},
    {label: "已完成", value: RecordStatus.COMPLETED, color: "green"},
    {label: "暂停", value: RecordStatus.ON_HOLD, color: "orange"},
    {label: "已弃坑", value: RecordStatus.DROPPED, color: "red"}
]

export const FOLLOW_TYPE_ITEMS: SelectItem<FollowType>[] = [
    {label: "追番", value: FollowType.CATCH_UP, color: "cyan"},
    {label: "补番", value: FollowType.FOLLOW, color: "green"},
    {label: "重看", value: FollowType.REWATCH, color: "orange"}
]

export const VALUE_TO_RECORD_STATUS = arrays.associateBy(RECORD_STATUS_ITEMS, i => i.value)
export const VALUE_TO_FOLLOW_TYPE = arrays.associateBy(FOLLOW_TYPE_ITEMS, i => i.value)