import { exceptionInternalServerError, InternalServerError } from "@/constants/exception"
import { safeExecute } from "@/helpers/execution"
import { err, ok, Result } from "@/schemas/all"
import { LegacyMigrationSummary, runLegacyMigration } from "@/helpers/legacy"

export async function migrateLegacyByToken(oldDatabaseUrl: string, userMapping: Record<string, string>, dryRun: boolean): Promise<Result<LegacyMigrationSummary, InternalServerError>> {
    return safeExecute(async () => {
        if(!oldDatabaseUrl) return err(exceptionInternalServerError("oldDatabaseUrl is required"))
        if(!userMapping || typeof userMapping !== "object" || Array.isArray(userMapping)) {
            return err(exceptionInternalServerError("userMapping is required"))
        }
        const summary = await runLegacyMigration({
            oldDatabaseUrl,
            userMapping,
            dryRun
        })
        return ok(summary)
    })
}
