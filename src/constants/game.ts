import { OnlineType } from "@/prisma/generated"

export const ONLINE_TYPE = [OnlineType.SINGLE_PLAYER, OnlineType.MULTI_PLAYER, OnlineType.ONLINE_GAME] as const