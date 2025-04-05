import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { semanticTokens } from "./semantic-tokens"
import { tokens } from "./tokens"

const config = defineConfig({
    theme: {
        semanticTokens,
        tokens
    },
})

export const system = createSystem(defaultConfig, config)
