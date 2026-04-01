import coreWebVitals from "eslint-config-next/core-web-vitals"

/** 仅约束 Prisma 生成路径：类型须用 type 导入；`@/prisma/generated/client` 仅允许值导入 `PrismaClient`。 */
const prismaGeneratedTypeImports = {
  meta: {
    type: "problem",
    docs: { description: "Prisma generated imports must use type-only form except PrismaClient" },
  },
  create(context) {
    const prismaGenerated = "@/prisma/generated"
    const prismaClientPath = "@/prisma/generated/client"

    function report(node, message) {
      context.report({ node, message })
    }

    return {
      ImportDeclaration(node) {
        const src = node.source && node.source.value
        if (src !== prismaGenerated && src !== prismaClientPath) return

        if (node.importKind === "type") return

        for (const spec of node.specifiers) {
          if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportNamespaceSpecifier") {
            report(spec, "禁止从 Prisma 生成路径使用 default / namespace 导入，请使用具名且带 type 的导入。")
            continue
          }
          if (spec.type !== "ImportSpecifier") continue
          if (spec.importKind === "type") continue

          const imported =
            spec.imported && spec.imported.type === "Identifier" ? spec.imported.name : null
          if (src === prismaClientPath && imported === "PrismaClient") continue

          report(
            spec,
            src === prismaClientPath
              ? "除 PrismaClient 外，从 @/prisma/generated/client 导入的符号须使用 `import type` 或 `import { type X }`。"
              : "从 @/prisma/generated 导入须使用 `import type` 或 `import { type X }`（该路径仅用于类型）。",
          )
        }
      },
    }
  },
}

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "src/generated/**",
      "**/generated/prisma/**",
      "prisma/generated/**",
    ],
  },
  ...coreWebVitals,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "reel-hub": { rules: { "prisma-type-imports": prismaGeneratedTypeImports } } },
    rules: { "reel-hub/prisma-type-imports": "error" },
  },
]

export default eslintConfig
