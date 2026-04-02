import { Pool, TypeOverrides } from "pg"
import type { Prisma } from "@/prisma/generated/client"
import { BoardcastType, FollowType, OriginalType, ProjectType } from "@/prisma/generated/enums"
import { getFollowType, getRecordStatus } from "@/helpers/data"
import { prisma } from "@/lib/prisma"

interface LegacyAnimationRow {
    id: number
    title: string
    origin_title: string | null
    other_title: string | null
    cover: string | null
    original_work_type: number | null
    publish_type: number | null
    publish_time: string | null
    episode_duration: number | null
    total_episodes: number
    published_episodes: number
    published_record: unknown
    publish_plan: unknown
    introduction: string | null
    keyword: string | null
    sex_limit_level: number | null
    violence_limit_level: number | null
    relations: unknown
    relations_topology: unknown
    create_time: Date
    update_time: Date
    creator: number
    updater: number
}

interface LegacyTagRow {
    id: number
    name: string
    introduction: string | null
    create_time: Date
    update_time: Date
    creator: number
    updater: number
}

interface LegacyStaffRow {
    id: number
    name: string
    origin_name: string | null
    remark: string | null
    create_time: Date
    update_time: Date
    creator: number
    updater: number
}

interface LegacyProjectStaffRelationRow {
    animation_id: number
    staff_id: number
    staff_type: number
}

interface LegacyProjectTagRelationRow {
    animation_id: number
    tag_id: number
}

interface LegacyCommentRow {
    owner_id: number
    animation_id: number
    score: number | null
    title: string | null
    article: string | null
    create_time: Date
    update_time: Date
}

interface LegacyRecordRow {
    id: number
    owner_id: number
    animation_id: number
    in_diary: boolean
    progress_count: number
    last_active_time: Date | null
    last_active_event: unknown
    create_time: Date
    update_time: Date
}

interface LegacyRecordProgressRow {
    record_id: number
    ordinal: number
    watched_episodes: number
    watched_record: unknown
    start_time: Date | null
    finish_time: Date | null
}

export interface LegacyMigrationOptions {
    oldDatabaseUrl: string
    userMapping: Record<string, string>
    dryRun?: boolean
}

export interface LegacyMigrationSummary {
    projects: number
    tags: number
    staffs: number
    comments: number
    records: number
    progresses: number
}

const OLD_PUBLISH_TYPES: BoardcastType[] = [BoardcastType.TV_AND_WEB, BoardcastType.MOVIE, BoardcastType.OVA_AND_OAD]
const OLD_ORIGINAL_TYPES: OriginalType[] = [OriginalType.ORIGINAL, OriginalType.MANGA, OriginalType.NOVEL, OriginalType.GAME, OriginalType.OTHER]
const STAFF_TYPE_TEXT = ["作者", "制作人员", "制作公司"]

/** PostgreSQL timestamp without time zone (OID 1114)。旧库按「无时区 UTC 墙上钟」存，node-pg 默认会按会话/进程时区解析，此处强制按 UTC 读。 */
const PG_TIMESTAMP_OID = 1114
/** PostgreSQL date (OID 1082)，按 UTC 当日 00:00:00 解析。 */
const PG_DATE_OID = 1082

function parseLegacyTimestampWithoutTzAsUtc(val: string | null): Date | null {
    if(val === null || val === undefined) return null
    const t = String(val).trim()
    if(t === "") return null
    const normalized = t.includes("T") ? t : t.replace(" ", "T")
    const withZone = normalized.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`
    const d = new Date(withZone)
    return Number.isNaN(d.getTime()) ? null : d
}

function parseLegacyDateAsUtcMidnight(val: string | null): Date | null {
    if(val === null || val === undefined) return null
    const s = String(val).trim()
    if(s === "") return null
    const d = new Date(`${s}T00:00:00.000Z`)
    return Number.isNaN(d.getTime()) ? null : d
}

function createLegacyPool(connectionString: string): Pool {
    const types = new TypeOverrides()
    types.setTypeParser(PG_TIMESTAMP_OID, val => parseLegacyTimestampWithoutTzAsUtc(val))
    types.setTypeParser(PG_DATE_OID, val => parseLegacyDateAsUtcMidnight(val))
    return new Pool({ connectionString, types })
}

function parseDate(value: Date | string | null | undefined): Date | null {
    if(!value) return null
    if(value instanceof Date) return value
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

function toMonthString(value: Date | string | null): string | null {
    if(!value) return null
    if(value instanceof Date) {
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
    }
    return value.slice(0, 7)
}

function joinWithPipe(items: (string | null | undefined)[]): string {
    return items.filter(i => !!i && i.trim().length > 0).join("|")
}

function mapOldUserId(mapping: Record<string, string>, oldUserId: number): string {
    const value = mapping[String(oldUserId)]
    if(!value) throw new Error(`Missing user mapping for old user id: ${oldUserId}`)
    return value
}

function normalizeDateArray(raw: unknown, targetSize: number): (Date | null)[] {
    const source = Array.isArray(raw) ? raw : []
    const parsed = source.map(item => {
        if(item === null || item === undefined) return null
        return parseDate(item as string | Date)
    })
    const normalized = parsed.slice(0, Math.max(targetSize, 0))
    while(normalized.length < targetSize) normalized.push(null)
    return normalized
}

function toPublishedRecords(raw: unknown, targetSize: number): { index: number, publishTime: string | null, actualEpisodeNum: number | null, episodeTitle: string | null }[] {
    return normalizeDateArray(raw, targetSize).map((item, idx) => ({
        index: idx + 1,
        publishTime: item ? item.toISOString() : null,
        actualEpisodeNum: null,
        episodeTitle: null
    }))
}

function toWatchedRecords(raw: unknown, targetSize: number): ({ watchedTime: string } | null)[] {
    return normalizeDateArray(raw, targetSize).map(item => item ? { watchedTime: item.toISOString() } : null)
}

function mapRelations(raw: unknown, idMap: Map<number, string>): Record<string, string[]> {
    if(typeof raw !== "object" || raw === null || Array.isArray(raw)) return {}
    const result: Record<string, string[]> = {}
    for(const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if(!Array.isArray(value)) continue
        const mapped = value
            .map(v => Number(v))
            .filter(v => Number.isFinite(v))
            .map(v => idMap.get(v))
            .filter((v): v is string => !!v)
        result[key] = mapped
    }
    return result
}

async function loadLegacyData(pool: Pool) {
    const [animations, tags, staffs, projectStaffRelations, projectTagRelations, comments, records, progresses] = await Promise.all([
        pool.query<LegacyAnimationRow>("SELECT * FROM animation ORDER BY id"),
        pool.query<LegacyTagRow>("SELECT id, name, introduction, create_time, update_time, creator, updater FROM tag ORDER BY id"),
        pool.query<LegacyStaffRow>("SELECT id, name, origin_name, remark, create_time, update_time, creator, updater FROM staff ORDER BY id"),
        pool.query<LegacyProjectStaffRelationRow>("SELECT animation_id, staff_id, staff_type FROM animation_staff_relation ORDER BY id"),
        pool.query<LegacyProjectTagRelationRow>("SELECT animation_id, tag_id FROM animation_tag_relation ORDER BY id"),
        pool.query<LegacyCommentRow>("SELECT owner_id, animation_id, score, title, article, create_time, update_time FROM comment ORDER BY id"),
        pool.query<LegacyRecordRow>("SELECT id, owner_id, animation_id, in_diary, progress_count, last_active_time, last_active_event, create_time, update_time FROM record ORDER BY id"),
        pool.query<LegacyRecordProgressRow>("SELECT record_id, ordinal, watched_episodes, watched_record, start_time, finish_time FROM record_progress ORDER BY record_id, ordinal")
    ])
    return {
        animations: animations.rows,
        tags: tags.rows,
        staffs: staffs.rows,
        projectStaffRelations: projectStaffRelations.rows,
        projectTagRelations: projectTagRelations.rows,
        comments: comments.rows,
        records: records.rows,
        progresses: progresses.rows
    }
}

function parsePlanRecords(raw: unknown, publishedNum: number): { index: number, publishTime: string | null, actualEpisodeNum: number | null, episodeTitle: string | null }[] {
    const source = Array.isArray(raw) ? raw : []
    return source.map((item, idx) => {
        const d = parseDate(item as string | Date)
        return {
            index: publishedNum + idx + 1,
            publishTime: d ? d.toISOString() : null,
            actualEpisodeNum: null,
            episodeTitle: null
        }
    })
}

function normalizeFollowType(value: FollowType | null): FollowType | null {
    return value ?? FollowType.CATCH_UP
}

export async function runLegacyMigration(options: LegacyMigrationOptions): Promise<LegacyMigrationSummary> {
    const userMapping = options.userMapping
    const pool = createLegacyPool(options.oldDatabaseUrl)
    try {
        const data = await loadLegacyData(pool)
        if(options.dryRun) {
            return {
                projects: data.animations.length,
                tags: data.tags.length,
                staffs: data.staffs.length,
                comments: data.comments.length,
                records: data.records.length,
                progresses: data.progresses.length
            }
        }

        return await prisma.$transaction(async tx => {
            const projectIdMap = new Map<number, string>()
            const staffIdMap = new Map<number, number>()
            const tagIdMap = new Map<number, number>()
            const progressesByRecord = new Map<number, LegacyRecordProgressRow[]>()

            for(const p of data.progresses) {
                const list = progressesByRecord.get(p.record_id)
                if(list) list.push(p)
                else progressesByRecord.set(p.record_id, [p])
            }

            for(const row of data.tags) {
                const creator = mapOldUserId(userMapping, row.creator)
                const updator = mapOldUserId(userMapping, row.updater)
                const tag = await tx.tag.upsert({
                    where: { type_name: { type: ProjectType.ANIME, name: row.name } },
                    create: {
                        type: ProjectType.ANIME,
                        name: row.name,
                        description: row.introduction ?? "",
                        createTime: parseDate(row.create_time) ?? new Date(),
                        updateTime: parseDate(row.update_time) ?? new Date(),
                        creator,
                        updator
                    },
                    update: {
                        description: row.introduction ?? "",
                        updateTime: parseDate(row.update_time) ?? new Date(),
                        updator
                    }
                })
                tagIdMap.set(row.id, tag.id)
            }

            for(const row of data.staffs) {
                const creator = mapOldUserId(userMapping, row.creator)
                const updator = mapOldUserId(userMapping, row.updater)
                const otherNames = joinWithPipe([row.origin_name, row.remark])
                const staff = await tx.staff.upsert({
                    where: { name: row.name },
                    create: {
                        name: row.name,
                        otherNames,
                        description: "",
                        createTime: parseDate(row.create_time) ?? new Date(),
                        updateTime: parseDate(row.update_time) ?? new Date(),
                        creator,
                        updator
                    },
                    update: {
                        otherNames,
                        updateTime: parseDate(row.update_time) ?? new Date(),
                        updator
                    }
                })
                staffIdMap.set(row.id, staff.id)
            }

            for(const row of data.animations) {
                const creator = mapOldUserId(userMapping, row.creator)
                const updator = mapOldUserId(userMapping, row.updater)
                const publishedNum = Math.max(0, row.published_episodes ?? 0)
                const publishedRecords = toPublishedRecords(row.published_record, publishedNum)
                const publishPlan = parsePlanRecords(row.publish_plan, publishedNum)
                const project = await tx.project.create({
                    data: {
                        title: row.title,
                        subtitles: joinWithPipe([row.origin_title, row.other_title]),
                        description: row.introduction ?? "",
                        keywords: joinWithPipe((row.keyword ?? "").split(/\s+/).filter(i => i.length > 0)),
                        type: ProjectType.ANIME,
                        publishTime: toMonthString(row.publish_time),
                        ratingS: row.sex_limit_level,
                        ratingV: row.violence_limit_level,
                        region: "jp",
                        relations: {} as Prisma.InputJsonValue,
                        relationsTopology: {} as Prisma.InputJsonValue,
                        resources: row.cover ? { avatar: `avatar/${row.cover}` } as Prisma.InputJsonValue : {} as Prisma.InputJsonValue,
                        createTime: parseDate(row.create_time) ?? new Date(),
                        updateTime: parseDate(row.update_time) ?? new Date(),
                        creator,
                        updator,
                        originalType: row.original_work_type !== null ? OLD_ORIGINAL_TYPES[row.original_work_type] : null,
                        boardcastType: row.publish_type !== null ? OLD_PUBLISH_TYPES[row.publish_type] : null,
                        episodeDuration: row.episode_duration,
                        episodeTotalNum: row.total_episodes,
                        episodePublishedNum: publishedNum,
                        episodePublishedRecords: publishedRecords as unknown as Prisma.InputJsonValue,
                        episodePublishPlan: publishPlan as unknown as Prisma.InputJsonValue,
                        platform: [],
                        onlineType: null
                    }
                })
                projectIdMap.set(row.id, project.id)
            }

            for(const row of data.animations) {
                const projectId = projectIdMap.get(row.id)
                if(!projectId) continue
                await tx.project.update({
                    where: { id: projectId },
                    data: {
                        relations: mapRelations(row.relations, projectIdMap) as Prisma.InputJsonValue,
                        relationsTopology: mapRelations(row.relations_topology, projectIdMap) as Prisma.InputJsonValue
                    }
                })
            }

            for(const row of data.projectStaffRelations) {
                const projectId = projectIdMap.get(row.animation_id)
                const staffId = staffIdMap.get(row.staff_id)
                if(!projectId || !staffId) continue
                const staffType = STAFF_TYPE_TEXT[row.staff_type] ?? "制作人员"
                await tx.projectStaffRelation.upsert({
                    where: { projectId_staffId_staffType: { projectId, staffId, staffType } },
                    create: { projectId, staffId, staffType },
                    update: {}
                })
            }

            for(const row of data.projectTagRelations) {
                const projectId = projectIdMap.get(row.animation_id)
                const tagId = tagIdMap.get(row.tag_id)
                if(!projectId || !tagId) continue
                await tx.projectTagRelation.upsert({
                    where: { projectId_tagId: { projectId, tagId } },
                    create: { projectId, tagId },
                    update: {}
                })
            }

            for(const row of data.comments) {
                const projectId = projectIdMap.get(row.animation_id)
                if(!projectId) continue
                const ownerId = mapOldUserId(userMapping, row.owner_id)
                await tx.comment.upsert({
                    where: { ownerId_projectId: { ownerId, projectId } },
                    create: {
                        ownerId,
                        projectId,
                        score: row.score,
                        title: row.title,
                        article: row.article,
                        createTime: parseDate(row.create_time) ?? new Date(),
                        updateTime: parseDate(row.update_time) ?? new Date()
                    },
                    update: {
                        score: row.score,
                        title: row.title,
                        article: row.article,
                        updateTime: parseDate(row.update_time) ?? new Date()
                    }
                })
            }

            for(const row of data.records) {
                const projectId = projectIdMap.get(row.animation_id)
                if(!projectId) continue
                const project = await tx.project.findUnique({ where: { id: projectId } })
                if(!project) continue
                const ownerId = mapOldUserId(userMapping, row.owner_id)
                const sortedProgresses = (progressesByRecord.get(row.id) ?? []).sort((a, b) => a.ordinal - b.ordinal)
                const latestProgress = sortedProgresses.length > 0 ? sortedProgresses[sortedProgresses.length - 1] : null
                const latestWatchedNum = latestProgress ? Math.max(0, latestProgress.watched_episodes) : null
                const latestEndTime = parseDate(latestProgress?.finish_time)

                const recordStartTime = sortedProgresses.length > 0
                    ? (parseDate(sortedProgresses[0].start_time) ?? parseDate(sortedProgresses[0].finish_time))
                    : null
                const lastActivityTime = parseDate(row.last_active_time) ?? parseDate(row.create_time)

                const record = await tx.record.upsert({
                    where: { ownerId_projectId: { ownerId, projectId } },
                    create: {
                        ownerId,
                        projectId,
                        specialAttention: row.in_diary,
                        status: getRecordStatus(row.progress_count, latestEndTime, project.episodeTotalNum, latestWatchedNum),
                        progressCount: row.progress_count,
                        startTime: recordStartTime,
                        endTime: latestEndTime,
                        lastActivityTime,
                        lastActivityEvent: (typeof row.last_active_event === "object" && row.last_active_event !== null ? row.last_active_event : {}) as Prisma.InputJsonValue,
                        createTime: parseDate(row.create_time) ?? new Date(),
                        updateTime: parseDate(row.update_time) ?? new Date()
                    },
                    update: {
                        specialAttention: row.in_diary,
                        status: getRecordStatus(row.progress_count, latestEndTime, project.episodeTotalNum, latestWatchedNum),
                        progressCount: row.progress_count,
                        startTime: recordStartTime,
                        endTime: latestEndTime,
                        lastActivityTime,
                        lastActivityEvent: (typeof row.last_active_event === "object" && row.last_active_event !== null ? row.last_active_event : {}) as Prisma.InputJsonValue,
                        updateTime: parseDate(row.update_time) ?? new Date()
                    }
                })

                await tx.recordProgress.deleteMany({ where: { recordId: record.id } })
                for(const p of sortedProgresses) {
                    const watchedNum = Math.max(0, p.watched_episodes ?? 0)
                    const endTime = parseDate(p.finish_time)
                    const startTime = parseDate(p.start_time) ?? endTime
                    const followType = normalizeFollowType(getFollowType(p.ordinal, project.boardcastType, project.publishTime, startTime))
                    await tx.recordProgress.create({
                        data: {
                            projectId,
                            recordId: record.id,
                            ordinal: p.ordinal,
                            isLatest: p.ordinal === row.progress_count,
                            status: getRecordStatus(p.ordinal, endTime, project.episodeTotalNum, watchedNum),
                            startTime,
                            endTime,
                            createTime: parseDate(row.create_time) ?? new Date(),
                            updateTime: parseDate(row.update_time) ?? new Date(),
                            episodeWatchedNum: watchedNum,
                            episodeWatchedRecords: toWatchedRecords(p.watched_record, watchedNum) as unknown as Prisma.InputJsonValue,
                            followType,
                            platform: []
                        }
                    })
                }

                const latest = await tx.recordProgress.findFirst({ where: { recordId: record.id, isLatest: true } })
                await tx.record.update({
                    where: { id: record.id },
                    data: { status: getRecordStatus(row.progress_count, latest?.endTime ?? null, project.episodeTotalNum, latest?.episodeWatchedNum ?? null) }
                })
            }

            return {
                projects: data.animations.length,
                tags: data.tags.length,
                staffs: data.staffs.length,
                comments: data.comments.length,
                records: data.records.length,
                progresses: data.progresses.length
            }
        }, {
            maxWait: 60_000,
            timeout: 600_000
        })
    } finally {
        await pool.end()
    }
}
