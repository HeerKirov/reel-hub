import { prisma } from "@/lib/prisma"
import {
    USER_PREFERENCE_DEFAULT, parseUserPreferenceSchema, type UserPreferenceSchema
} from "@/schemas/user-preference"
import { isValidIanaTimeZone } from "@/helpers/subscription"

/** 按 userId 读取偏好；无记录或与 DB 默认值等价时返回默认结构；非法 timezone 视为 null。 */
