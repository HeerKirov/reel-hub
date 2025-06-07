import { BoardcastType, OriginalType } from "@/prisma/generated"

export const ORIGINAL_TYPE = [OriginalType.GAME, OriginalType.MANGA, OriginalType.NOVEL, OriginalType.ORIGINAL, OriginalType.OTHER] as const

export const BOARDCAST_TYPE = [BoardcastType.MOVIE, BoardcastType.OTHER, BoardcastType.OVA_AND_OAD, BoardcastType.TV_AND_WEB] as const